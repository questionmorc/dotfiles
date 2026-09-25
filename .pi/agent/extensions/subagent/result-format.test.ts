import assert from "node:assert/strict";
import { test } from "node:test";
import {
	allocateBudget,
	clipToBytes,
	collectFinalText,
	formatParallelContent,
	type ParallelEntry,
	withCapWarning,
} from "./result-format.ts";

const assistant = (...parts: ({ type: "text"; text: string } | { type: "toolCall"; name: string })[]) => ({
	role: "assistant" as const,
	content: parts,
});

test("collectFinalText joins every text part of the final assistant message", () => {
	const messages = [assistant({ type: "text", text: "first" }, { type: "text", text: "second" })];
	assert.equal(collectFinalText(messages), "first\nsecond");
});

test("collectFinalText keeps text that follows a tool call within the same message", () => {
	const messages = [
		assistant({ type: "text", text: "before" }, { type: "toolCall", name: "read" }, { type: "text", text: "after" }),
	];
	assert.equal(collectFinalText(messages), "before\nafter");
});

test("collectFinalText falls back to an earlier message when the last one has no text", () => {
	const messages = [assistant({ type: "text", text: "findings" }), assistant({ type: "toolCall", name: "read" })];
	assert.equal(collectFinalText(messages), "findings");
});

test("collectFinalText ignores non-assistant messages", () => {
	const messages = [
		assistant({ type: "text", text: "findings" }),
		{ role: "toolResult" as const, content: [{ type: "text", text: "tool output" }] },
	];
	assert.equal(collectFinalText(messages), "findings");
});

test("collectFinalText returns an empty string when nothing was said", () => {
	assert.equal(collectFinalText([]), "");
});

test("allocateBudget grants every task its full size when the total fits", () => {
	assert.deepEqual(allocateBudget([10, 20, 30], 100), [10, 20, 30]);
});

test("allocateBudget redistributes unused share to the tasks that need it", () => {
	assert.deepEqual(allocateBudget([10, 10, 400], 120), [10, 10, 100]);
});

test("allocateBudget splits evenly when every task exceeds its share", () => {
	assert.deepEqual(allocateBudget([500, 500, 500], 90), [30, 30, 30]);
});

test("allocateBudget handles an empty task list", () => {
	assert.deepEqual(allocateBudget([], 100), []);
});

test("clipToBytes returns the input untouched when it fits", () => {
	assert.deepEqual(clipToBytes("hello", 100), { text: "hello", clipped: false });
});

test("clipToBytes cuts on a line boundary", () => {
	assert.deepEqual(clipToBytes("aaa\nbbb\nccc", 8), { text: "aaa\nbbb", clipped: true });
});

test("clipToBytes never splits a multi-byte character", () => {
	const { text } = clipToBytes("é".repeat(10), 5);
	assert.equal(text, "éé");
});

test("clipToBytes yields nothing when the budget is zero", () => {
	assert.deepEqual(clipToBytes("aaa", 0), { text: "", clipped: true });
});

const entry = (over: Partial<ParallelEntry> = {}): ParallelEntry => ({
	agent: "scout",
	output: "findings",
	failureReason: undefined,
	outputCapped: false,
	...over,
});

test("formatParallelContent emits full output and never spills when everything fits", () => {
	const spilled: string[] = [];
	const text = formatParallelContent([entry({ output: "alpha" }), entry({ output: "beta" })], {
		budget: 1000,
		spill: (_agent, _index, body) => {
			spilled.push(body);
			return "/tmp/never";
		},
	});
	assert.equal(spilled.length, 0);
	assert.match(text, /Parallel: 2\/2 succeeded/);
	assert.match(text, /alpha/);
	assert.match(text, /beta/);
	assert.doesNotMatch(text, /full output:/);
});

test("formatParallelContent spills the full body and points at the file when clipped", () => {
	const long = "x".repeat(500);
	const spilled: { index: number; body: string }[] = [];
	const text = formatParallelContent([entry({ output: long })], {
		budget: 100,
		spill: (_agent, index, body) => {
			spilled.push({ index, body });
			return "/tmp/pi-subagent-out/1-scout.md";
		},
	});
	assert.deepEqual(spilled, [{ index: 0, body: long }]);
	assert.match(text, /full output: `\/tmp\/pi-subagent-out\/1-scout\.md`/);
	assert.match(text, /clipped/);
	assert.ok(!text.includes(long));
});

test("formatParallelContent keeps the clipped body when spilling is unavailable", () => {
	const text = formatParallelContent([entry({ output: "y".repeat(500) })], {
		budget: 100,
		spill: () => undefined,
	});
	assert.match(text, /clipped/);
	assert.doesNotMatch(text, /full output:/);
});

test("formatParallelContent reports the failure reason for a failed task", () => {
	const text = formatParallelContent([entry({ output: "", failureReason: "could not start" })], {
		budget: 1000,
		spill: () => undefined,
	});
	assert.match(text, /Parallel: 0\/1 succeeded/);
	assert.match(text, /failed \(could not start\)/);
});

test("formatParallelContent warns when a task hit its output token limit", () => {
	const text = formatParallelContent([entry({ output: "half a th", outputCapped: true })], {
		budget: 1000,
		spill: () => undefined,
	});
	assert.match(text, /output token limit/);
	assert.match(text, /half a th/);
});

test("formatParallelContent labels each task with its index and agent", () => {
	const text = formatParallelContent([entry({ agent: "scout" }), entry({ agent: "reviewer" })], {
		budget: 1000,
		spill: () => undefined,
	});
	assert.match(text, /\[1\] scout/);
	assert.match(text, /\[2\] reviewer/);
});

test("withCapWarning appends a warning only when the output was capped", () => {
	assert.equal(withCapWarning("body", false), "body");
	assert.match(withCapWarning("body", true), /^body\n\n.*output token limit/s);
});
