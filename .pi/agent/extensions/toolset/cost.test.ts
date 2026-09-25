import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateTokens, explode, selectionCost } from "./cost.ts";

const tool = (name: string, description = "", inputSchema?: unknown) => ({
	name,
	description,
	inputSchema,
});

const cache = {
	"mcp-rw-jira": [
		tool("jira_get_issue", "x".repeat(1500), { type: "object" }),
		tool("jira_search", "y".repeat(600)),
	],
	grafana: [tool("query_prometheus", "z".repeat(300))],
};

test("an empty selection costs nothing", () => {
	const c = selectionCost([], cache);
	assert.equal(c.tools, 0);
	assert.equal(c.tokens, 0);
});

test("estimating nothing costs nothing", () => {
	assert.equal(estimateTokens([]), 0);
});

test("a bare server selector costs all of its tools", () => {
	const c = selectionCost(["grafana"], cache);
	assert.equal(c.tools, 1);
	assert.ok(c.tokens > 0);
});

test("a single tool selector costs less than its whole server", () => {
	const one = selectionCost(["mcp-rw-jira/jira_search"], cache);
	const all = selectionCost(["mcp-rw-jira"], cache);
	assert.equal(one.tools, 1);
	assert.equal(all.tools, 2);
	assert.ok(one.tokens < all.tokens);
});

test("cost grows with description length", () => {
	const small = estimateTokens([tool("a", "x".repeat(100))]);
	const large = estimateTokens([tool("a", "x".repeat(2000))]);
	assert.ok(large > small * 5);
});

test("an unknown selector contributes nothing", () => {
	const c = selectionCost(["ghost", "grafana/ghost"], cache);
	assert.equal(c.tools, 0);
	assert.equal(c.tokens, 0);
});

test("a selection is the sum of its parts", () => {
	const a = selectionCost(["grafana"], cache);
	const b = selectionCost(["mcp-rw-jira/jira_search"], cache);
	const both = selectionCost(["grafana", "mcp-rw-jira/jira_search"], cache);
	assert.equal(both.tokens, a.tokens + b.tokens);
	assert.equal(both.tools, 2);
});

test(
	"explode names each tool with its server prefix and cost",
	() => {
		const rows = explode(["grafana"], cache);
		assert.deepEqual(
			rows.map((r) => r.name),
			["grafana_query_prometheus"],
		);
		assert.ok(rows[0].tokens > 0);
	},
);

test("explode expands a whole server into one row per tool", () => {
	const rows = explode(["mcp-rw-jira"], cache);
	assert.deepEqual(rows.map((r) => r.name), [
		"mcp-rw-jira_jira_get_issue",
		"mcp-rw-jira_jira_search",
	]);
});

test("explode keeps a single tool selector to one row", () => {
	const rows = explode(["mcp-rw-jira/jira_search"], cache);
	assert.equal(rows.length, 1);
	assert.equal(rows[0].server, "mcp-rw-jira");
});

test("explode rows sum to the selection cost", () => {
	const selection = ["grafana", "mcp-rw-jira/jira_search"];
	const rows = explode(selection, cache);
	const total = rows.reduce((sum, r) => sum + r.tokens, 0);
	assert.equal(total, selectionCost(selection, cache).tokens);
});

test("explode skips unknown selectors", () => {
	assert.deepEqual(explode(["ghost", "grafana/ghost"], cache), []);
});

// The fit was derived from 268 tools counted exactly against Anthropic's
// count_tokens endpoint: tokens = 0.28746 * chars + 18.12, median error 6.9%.
test("the estimate tracks the measured fit", () => {
	const description = "x".repeat(2000);
	const chars = JSON.stringify({
		name: "t",
		description,
		input_schema: {},
	}).length;
	const expected = Math.round(0.28746 * chars + 18.12);
	assert.equal(estimateTokens([tool("t", description, {})]), expected);
});
