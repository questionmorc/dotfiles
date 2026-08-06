/**
 * Child process lifecycle for spawned subagents.
 *
 * A headless `pi --mode json -p` child is not guaranteed to exit once its work
 * is done: print mode returns an exit code and lets the event loop drain, so any
 * extension that leaks a libuv handle pins the child forever. Completion is
 * therefore taken from the `agent_settled` event (pi's documented terminal
 * event) rather than from process exit, and the process is reaped afterwards.
 *
 * The child is spawned in its own process group so a reap also collects the
 * language servers and helpers it spawned.
 */

import { spawn as nodeSpawn } from "node:child_process";

export const STDERR_CAP_BYTES = 64 * 1024;

export type ChildOutcome = "settled" | "exited" | "spawn-error" | "idle-timeout" | "aborted";

export interface ChildResult {
	outcome: ChildOutcome;
	exitCode: number | null;
	signal: string | null;
	stderr: string;
	terminationNote?: string;
}

export type TimerHandle = unknown;

export interface Scheduler {
	setTimeout(fn: () => void, ms: number): TimerHandle;
	clearTimeout(handle: TimerHandle | undefined): void;
}

export interface ChildLike {
	pid: number | undefined;
	stdout: { on(event: "data", cb: (chunk: string | Buffer) => void): unknown } | null;
	stderr: { on(event: "data", cb: (chunk: string | Buffer) => void): unknown } | null;
	on(event: "close", cb: (code: number | null, signal: string | null) => void): unknown;
	on(event: "error", cb: (err: Error) => void): unknown;
}

export type SpawnLike = (
	command: string,
	args: string[],
	options: {
		cwd: string;
		env: NodeJS.ProcessEnv;
		shell: false;
		detached: boolean;
		stdio: ["ignore", "pipe", "pipe"];
	},
) => ChildLike;

export type KillLike = (pid: number, signal: NodeJS.Signals) => void;

export interface RunChildDeps {
	spawn: SpawnLike;
	kill: KillLike;
	scheduler: Scheduler;
}

export interface RunChildOptions {
	command: string;
	args: string[];
	cwd: string;
	env: NodeJS.ProcessEnv;
	label?: string;
	signal?: AbortSignal;
	settleGraceMs: number;
	killEscalationMs: number;
	idleTimeoutMs: number;
	onEvent: (event: Record<string, unknown>) => void;
	onReap?: (note: string) => void;
	deps?: Partial<RunChildDeps>;
}

const defaultKill: KillLike = (pid, signal) => {
	try {
		process.kill(pid, signal);
	} catch {
		/* already gone */
	}
};

const defaultDeps: RunChildDeps = {
	spawn: nodeSpawn as unknown as SpawnLike,
	kill: defaultKill,
	scheduler: {
		setTimeout: (fn, ms) => setTimeout(fn, ms),
		clearTimeout: (handle) => clearTimeout(handle as NodeJS.Timeout),
	},
};

const liveGroups = new Set<{ pid: number; kill: KillLike }>();
const unreportedReapNotes: string[] = [];

/** Queues a reap note for whichever tool invocation reports next. */
export function fileReapNote(note: string): void {
	unreportedReapNotes.push(note);
}

/**
 * Returns a per-invocation collector. A reap completes after its own tool result
 * has been returned, so notes are carried to the next invocation that reports.
 * The collector accumulates rather than drains, so repeated calls during one
 * invocation (streaming updates) cannot consume a note that the final result
 * still needs to show.
 */
export function createReapNoteCollector(): () => string[] {
	const collected: string[] = [];
	return () => {
		collected.push(...unreportedReapNotes.splice(0, unreportedReapNotes.length));
		return [...collected];
	};
}

/** Group-kills every child still being tracked. For the host process's exit hooks. */
export function killLiveChildren(): void {
	for (const entry of [...liveGroups]) {
		liveGroups.delete(entry);
		entry.kill(-entry.pid, "SIGKILL");
	}
}

export function runChild(options: RunChildOptions): Promise<ChildResult> {
	const deps = { ...defaultDeps, ...options.deps };
	const { scheduler } = deps;
	const label = options.label ?? "subagent";

	return new Promise<ChildResult>((resolve) => {
		const child = deps.spawn(options.command, options.args, {
			cwd: options.cwd,
			env: options.env,
			shell: false,
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
		});

		const tracked = child.pid !== undefined ? { pid: child.pid, kill: deps.kill } : undefined;
		if (tracked) liveGroups.add(tracked);

		let stderr = "";
		let stdoutBuffer = "";
		let settled = false;
		let resolved = false;
		let closed = false;
		let forcedReason: "abort" | "idle" | undefined;
		const signalsSent: NodeJS.Signals[] = [];
		let graceTimer: TimerHandle;
		let killTimer: TimerHandle;
		let idleTimer: TimerHandle;

		const clearTimers = () => {
			scheduler.clearTimeout(graceTimer);
			scheduler.clearTimeout(killTimer);
			scheduler.clearTimeout(idleTimer);
			graceTimer = undefined;
			killTimer = undefined;
			idleTimer = undefined;
		};

		const signalGroup = (sig: NodeJS.Signals) => {
			if (child.pid === undefined || closed) return;
			signalsSent.push(sig);
			deps.kill(-child.pid, sig);
		};

		const escalate = () => {
			scheduler.clearTimeout(killTimer);
			killTimer = scheduler.setTimeout(() => signalGroup("SIGKILL"), options.killEscalationMs);
		};

		const terminateNow = (reason: "abort" | "idle") => {
			if (closed || forcedReason) return;
			forcedReason = reason;
			clearTimers();
			signalGroup("SIGTERM");
			escalate();
		};

		const settle = (result: ChildResult) => {
			if (resolved) return;
			resolved = true;
			resolve(result);
		};

		const armIdleTimer = () => {
			if (settled || closed || forcedReason) return;
			scheduler.clearTimeout(idleTimer);
			idleTimer = scheduler.setTimeout(() => {
				terminateNow("idle");
				settle({
					outcome: "idle-timeout",
					exitCode: null,
					signal: null,
					stderr,
					terminationNote: `${label}: no output for ${Math.round(options.idleTimeoutMs / 60_000)}m, terminated`,
				});
			}, options.idleTimeoutMs);
		};

		const onSettledEvent = () => {
			settled = true;
			scheduler.clearTimeout(idleTimer);
			idleTimer = undefined;
			settle({ outcome: "settled", exitCode: null, signal: null, stderr });
			graceTimer = scheduler.setTimeout(() => {
				signalGroup("SIGTERM");
				escalate();
			}, options.settleGraceMs);
		};

		const handleLine = (line: string) => {
			if (!line.trim()) return;
			let event: Record<string, unknown>;
			try {
				event = JSON.parse(line);
			} catch {
				return;
			}
			options.onEvent(event);
			if (event.type === "agent_settled") onSettledEvent();
		};

		child.stdout?.on("data", (chunk) => {
			armIdleTimer();
			stdoutBuffer += chunk.toString();
			const lines = stdoutBuffer.split("\n");
			stdoutBuffer = lines.pop() ?? "";
			for (const line of lines) handleLine(line);
		});

		child.stderr?.on("data", (chunk) => {
			if (stderr.length >= STDERR_CAP_BYTES) return;
			stderr = (stderr + chunk.toString()).slice(0, STDERR_CAP_BYTES);
		});

		child.on("close", (code, signal) => {
			closed = true;
			if (tracked) liveGroups.delete(tracked);
			clearTimers();
			if (stdoutBuffer.trim()) handleLine(stdoutBuffer);
			stdoutBuffer = "";

			if (settled) {
				if (signalsSent.length > 0) {
					options.onReap?.(
						`${label}: completed but did not exit; reaped with ${signalsSent.join(", ")} after ${
							options.settleGraceMs / 1000
						}s`,
					);
				}
				return;
			}
			const outcome: ChildOutcome =
				forcedReason === "abort" ? "aborted" : forcedReason === "idle" ? "idle-timeout" : "exited";
			settle({ outcome, exitCode: code, signal, stderr });
		});

		child.on("error", (err) => {
			closed = true;
			if (tracked) liveGroups.delete(tracked);
			clearTimers();
			settle({ outcome: "spawn-error", exitCode: null, signal: null, stderr: stderr || err.message });
		});

		if (options.signal) {
			const onAbort = () => {
				terminateNow("abort");
				settle({
					outcome: "aborted",
					exitCode: null,
					signal: null,
					stderr,
					terminationNote: `${label}: aborted`,
				});
			};
			if (options.signal.aborted) onAbort();
			else options.signal.addEventListener("abort", onAbort, { once: true });
		}

		armIdleTimer();
	});
}
