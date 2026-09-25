import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveToolsets } from "./resolve.ts";
import type { ToolsetsConfig } from "./resolve.ts";

const config: ToolsetsConfig = {
	defaultToolset: "none",
	toolsets: {
		none: { description: "nothing", mcp: [] },
		grafana: { mcp: ["grafana"] },
		pager: { mcp: ["pagerduty-mcp/list_incidents"] },
		"on-call": { extends: ["grafana", "pager"], mcp: ["mcp-rw-jira"] },
		wide: { extends: ["on-call"] },
		selfish: { extends: ["selfish"], mcp: ["a"] },
		"loop-a": { extends: ["loop-b"], mcp: ["a"] },
		"loop-b": { extends: ["loop-a"], mcp: ["b"] },
	},
};

test("a leaf toolset returns its own selectors", () => {
	const r = resolveToolsets(config, ["grafana"]);
	assert.deepEqual(r.selectors, ["grafana"]);
	assert.deepEqual(r.unknown, []);
});

test("extends unions parent selectors before its own", () => {
	const r = resolveToolsets(config, ["on-call"]);
	assert.deepEqual(r.selectors, [
		"grafana",
		"pagerduty-mcp/list_incidents",
		"mcp-rw-jira",
	]);
});

test("extends is transitive", () => {
	const r = resolveToolsets(config, ["wide"]);
	assert.deepEqual(r.selectors, [
		"grafana",
		"pagerduty-mcp/list_incidents",
		"mcp-rw-jira",
	]);
});

test("combining toolsets unions them and dedupes", () => {
	const r = resolveToolsets(config, ["grafana", "on-call"]);
	assert.deepEqual(r.selectors, [
		"grafana",
		"pagerduty-mcp/list_incidents",
		"mcp-rw-jira",
	]);
});

test("a self-referencing toolset resolves instead of hanging", () => {
	const r = resolveToolsets(config, ["selfish"]);
	assert.deepEqual(r.selectors, ["a"]);
});

test("a mutual extends cycle resolves instead of hanging", () => {
	const r = resolveToolsets(config, ["loop-a"]);
	assert.deepEqual(r.selectors, ["b", "a"]);
});

test("an empty mcp array yields no selectors", () => {
	const r = resolveToolsets(config, ["none"]);
	assert.deepEqual(r.selectors, []);
});

test("an unknown toolset name is reported and skipped", () => {
	const r = resolveToolsets(config, ["grafana", "ghost"]);
	assert.deepEqual(r.selectors, ["grafana"]);
	assert.deepEqual(r.unknown, ["ghost"]);
	assert.deepEqual(r.names, ["grafana"]);
});

test("an unknown parent in extends is reported", () => {
	const r = resolveToolsets(
		{ toolsets: { x: { extends: ["ghost"], mcp: ["a"] } } },
		["x"],
	);
	assert.deepEqual(r.selectors, ["a"]);
	assert.deepEqual(r.unknown, ["ghost"]);
});

test("an absent toolsets map resolves to nothing", () => {
	const r = resolveToolsets({}, ["anything"]);
	assert.deepEqual(r.selectors, []);
	assert.deepEqual(r.unknown, ["anything"]);
});

test("reserved keys are ignored by mcp resolution", () => {
	const r = resolveToolsets(
		{
			toolsets: {
				future: { mcp: ["grafana"], tools: ["web_search"], excludeTools: ["x"] },
			},
		},
		["future"],
	);
	assert.deepEqual(r.selectors, ["grafana"]);
});
