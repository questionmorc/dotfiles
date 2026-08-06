import assert from "node:assert/strict";
import * as path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runChild } from "./child-runner.ts";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "leaky-child.cjs");

const alive = (pid: number) => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

async function waitFor(condition: () => boolean, timeoutMs: number): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (condition()) return true;
		await new Promise((r) => setTimeout(r, 50));
	}
	return condition();
}

const waitUntilDead = (pid: number, timeoutMs: number) => waitFor(() => !alive(pid), timeoutMs);

function runFixture(mode: string, notes: string[], events: Record<string, unknown>[]) {
	return runChild({
		command: process.execPath,
		args: [fixture, mode],
		cwd: process.cwd(),
		env: process.env,
		label: "fixture",
		settleGraceMs: 300,
		killEscalationMs: 300,
		idleTimeoutMs: 30_000,
		onEvent: (event) => events.push(event),
		onReap: (note) => notes.push(note),
	});
}

test("reaps a real child that completes but will not exit, and its grandchild", async () => {
	const notes: string[] = [];
	const events: Record<string, unknown>[] = [];
	const started = Date.now();
	const result = await runFixture("hang", notes, events);
	const settleLatency = Date.now() - started;

	assert.equal(result.outcome, "settled");
	assert.ok(settleLatency < 300, `resolved before the grace window (${settleLatency}ms)`);

	const grandchildPid = events.find((e) => e.type === "grandchild")?.pid as number;
	assert.ok(grandchildPid, "fixture reported a grandchild pid");

	assert.ok(await waitUntilDead(grandchildPid, 5000), "grandchild was collected by the group kill");
	assert.ok(await waitFor(() => notes.length > 0, 5000), "a reap note was filed");
	assert.equal(notes.length, 1);
	assert.match(notes[0], /fixture: completed but did not exit/);
});

test("escalates to SIGKILL against a real child that ignores SIGTERM", async () => {
	const notes: string[] = [];
	const events: Record<string, unknown>[] = [];
	const result = await runFixture("ignore-sigterm", notes, events);
	assert.equal(result.outcome, "settled");

	const grandchildPid = events.find((e) => e.type === "grandchild")?.pid as number;
	assert.ok(await waitUntilDead(grandchildPid, 5000), "grandchild died after SIGKILL escalation");
	assert.ok(await waitFor(() => notes.length > 0, 5000), "a reap note was filed");
	assert.match(notes[0], /SIGKILL/);
});
