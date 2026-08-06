import assert from "node:assert/strict";
import { test } from "node:test";
import {
	type ChildLike,
	createReapNoteCollector,
	fileReapNote,
	runChild,
	type Scheduler,
	STDERR_CAP_BYTES,
} from "./child-runner.ts";

class FakeStream {
	private handlers: ((chunk: string) => void)[] = [];
	on(_event: "data", cb: (chunk: string) => void): this {
		this.handlers.push(cb);
		return this;
	}
	push(chunk: string): void {
		for (const handler of this.handlers) handler(chunk);
	}
}

class FakeChild implements ChildLike {
	pid: number | undefined = 4242;
	stdout = new FakeStream();
	stderr = new FakeStream();
	private closeHandlers: ((code: number | null, signal: string | null) => void)[] = [];
	private errorHandlers: ((err: Error) => void)[] = [];

	on(event: "close" | "error", cb: never): this {
		if (event === "close") this.closeHandlers.push(cb as unknown as (c: number | null, s: string | null) => void);
		else this.errorHandlers.push(cb as unknown as (e: Error) => void);
		return this;
	}
	emitEvent(event: unknown): void {
		this.stdout.push(`${JSON.stringify(event)}\n`);
	}
	close(code: number | null, signal: string | null = null): void {
		for (const handler of this.closeHandlers) handler(code, signal);
	}
	fail(err: Error): void {
		for (const handler of this.errorHandlers) handler(err);
	}
}

class FakeScheduler implements Scheduler {
	private nextId = 0;
	private timers = new Map<number, { fn: () => void; at: number }>();
	private now = 0;

	setTimeout(fn: () => void, ms: number): number {
		const id = ++this.nextId;
		this.timers.set(id, { fn, at: this.now + ms });
		return id;
	}
	clearTimeout(handle: number | undefined): void {
		if (handle !== undefined) this.timers.delete(handle);
	}
	advance(ms: number): void {
		this.now += ms;
		for (;;) {
			const due = [...this.timers.entries()].filter(([, t]) => t.at <= this.now);
			if (due.length === 0) return;
			for (const [id, timer] of due) {
				this.timers.delete(id);
				timer.fn();
			}
		}
	}
	get pending(): number {
		return this.timers.size;
	}
}

interface Harness {
	child: FakeChild;
	clock: FakeScheduler;
	kills: { pid: number; signal: string }[];
	events: Record<string, unknown>[];
	notes: string[];
	spawnArgs: { command: string; args: string[]; options: Record<string, unknown> }[];
}

function harness(overrides: { pid?: number | undefined } = {}) {
	const child = new FakeChild();
	if ("pid" in overrides) child.pid = overrides.pid;
	const state: Harness = { child, clock: new FakeScheduler(), kills: [], events: [], notes: [], spawnArgs: [] };
	const run = (options: { signal?: AbortSignal; idleTimeoutMs?: number } = {}) =>
		runChild({
			command: "pi",
			args: ["--mode", "json"],
			cwd: "/repo",
			env: {},
			label: "scout",
			settleGraceMs: 5000,
			killEscalationMs: 5000,
			idleTimeoutMs: options.idleTimeoutMs ?? 900_000,
			signal: options.signal,
			onEvent: (event) => state.events.push(event),
			onReap: (note) => state.notes.push(note),
			deps: {
				spawn: (command, args, spawnOptions) => {
					state.spawnArgs.push({ command, args, options: spawnOptions as Record<string, unknown> });
					return child;
				},
				kill: (pid, signal) => state.kills.push({ pid, signal }),
				scheduler: state.clock,
			},
		});
	return { ...state, run };
}

test("spawns the child in its own process group", async () => {
	const h = harness();
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	assert.equal(h.spawnArgs[0].options.detached, true);
	assert.deepEqual(h.spawnArgs[0].options.stdio, ["ignore", "pipe", "pipe"]);
});

test("resolves as settled on agent_settled without waiting for exit", async () => {
	const h = harness();
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	const result = await pending;
	assert.equal(result.outcome, "settled");
	assert.equal(h.kills.length, 0);
});

test("forwards parsed events, reassembling split chunks", async () => {
	const h = harness();
	const pending = h.run();
	h.child.stdout.push('{"type":"turn_start"}\n{"type":"message_');
	h.child.stdout.push('start","message":{"role":"assistant"}}\n');
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	assert.deepEqual(
		h.events.map((e) => e.type),
		["turn_start", "message_start", "agent_settled"],
	);
});

test("ignores unparseable stdout lines", async () => {
	const h = harness();
	const pending = h.run();
	h.child.stdout.push("Warning: model not found\n");
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	assert.deepEqual(
		h.events.map((e) => e.type),
		["agent_settled"],
	);
});

test("sends no signal and files no note when the child exits within the grace window", async () => {
	const h = harness();
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	h.clock.advance(2000);
	h.child.close(0);
	h.clock.advance(60_000);
	assert.deepEqual(h.kills, []);
	assert.deepEqual(h.notes, []);
	assert.equal(h.clock.pending, 0);
});

test("group-SIGTERMs a settled child that will not exit, and files a note", async () => {
	const h = harness();
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	h.clock.advance(5000);
	assert.deepEqual(h.kills, [{ pid: -4242, signal: "SIGTERM" }]);
	h.child.close(null, "SIGTERM");
	assert.equal(h.notes.length, 1);
	assert.match(h.notes[0], /scout/);
	assert.match(h.notes[0], /SIGTERM/);
});

test("escalates to group SIGKILL when SIGTERM is ignored", async () => {
	const h = harness();
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	h.clock.advance(5000);
	h.clock.advance(5000);
	assert.deepEqual(h.kills, [
		{ pid: -4242, signal: "SIGTERM" },
		{ pid: -4242, signal: "SIGKILL" },
	]);
	h.child.close(null, "SIGKILL");
	assert.match(h.notes[0], /SIGKILL/);
});

test("reports idle-timeout and terminates when the child goes silent", async () => {
	const h = harness();
	const pending = h.run({ idleTimeoutMs: 900_000 });
	h.child.emitEvent({ type: "turn_start" });
	h.clock.advance(900_000);
	const result = await pending;
	assert.equal(result.outcome, "idle-timeout");
	assert.deepEqual(h.kills, [{ pid: -4242, signal: "SIGTERM" }]);
});

test("resets the idle timer on stdout activity", async () => {
	const h = harness();
	const pending = h.run({ idleTimeoutMs: 900_000 });
	h.clock.advance(800_000);
	h.child.emitEvent({ type: "tool_execution_update" });
	h.clock.advance(800_000);
	assert.deepEqual(h.kills, []);
	h.child.emitEvent({ type: "agent_settled" });
	assert.equal((await pending).outcome, "settled");
});

test("reports exited with the exit code when the child dies without settling", async () => {
	const h = harness();
	const pending = h.run();
	h.child.stderr.push("boom\n");
	h.child.close(3);
	const result = await pending;
	assert.equal(result.outcome, "exited");
	assert.equal(result.exitCode, 3);
	assert.equal(result.stderr, "boom\n");
});

test("distinguishes a signal death from a clean exit", async () => {
	const h = harness();
	const pending = h.run();
	h.child.close(null, "SIGSEGV");
	const result = await pending;
	assert.equal(result.outcome, "exited");
	assert.equal(result.exitCode, null);
	assert.equal(result.signal, "SIGSEGV");
});

test("reports spawn-error when the process cannot start", async () => {
	const h = harness();
	const pending = h.run();
	h.child.fail(new Error("spawn pi ENOENT"));
	const result = await pending;
	assert.equal(result.outcome, "spawn-error");
	assert.match(result.stderr, /ENOENT/);
});

test("aborts immediately with no grace window and preserves collected events", async () => {
	const controller = new AbortController();
	const h = harness();
	const pending = h.run({ signal: controller.signal });
	h.child.emitEvent({ type: "turn_start" });
	controller.abort();
	assert.deepEqual(h.kills, [{ pid: -4242, signal: "SIGTERM" }]);
	const result = await pending;
	assert.equal(result.outcome, "aborted");
	assert.deepEqual(
		h.events.map((e) => e.type),
		["turn_start"],
	);
});

test("terminates when the abort signal is already aborted at spawn time", async () => {
	const h = harness();
	const result = await h.run({ signal: AbortSignal.abort() });
	assert.equal(result.outcome, "aborted");
	assert.deepEqual(h.kills, [{ pid: -4242, signal: "SIGTERM" }]);
});

test("caps accumulated stderr", async () => {
	const h = harness();
	const pending = h.run();
	h.child.stderr.push("x".repeat(STDERR_CAP_BYTES + 5000));
	h.child.close(1);
	const result = await pending;
	assert.equal(result.stderr.length, STDERR_CAP_BYTES);
});

test("a collector reports notes filed before it was created", () => {
	fileReapNote("scout: reaped");
	assert.deepEqual(createReapNoteCollector()(), ["scout: reaped"]);
});

test("a collector accumulates across calls instead of draining", () => {
	const collect = createReapNoteCollector();
	fileReapNote("first");
	assert.deepEqual(collect(), ["first"]);
	fileReapNote("second");
	assert.deepEqual(collect(), ["first", "second"]);
	assert.deepEqual(collect(), ["first", "second"]);
});

test("a note already reported by one collector is not repeated by the next", () => {
	const first = createReapNoteCollector();
	fileReapNote("only-once");
	assert.deepEqual(first(), ["only-once"]);
	assert.deepEqual(createReapNoteCollector()(), []);
});

test("never signals when the child has no pid", async () => {
	const h = harness({ pid: undefined });
	const pending = h.run();
	h.child.emitEvent({ type: "agent_settled" });
	await pending;
	h.clock.advance(60_000);
	assert.deepEqual(h.kills, []);
});
