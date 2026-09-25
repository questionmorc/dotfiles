import assert from "node:assert/strict";
import { test } from "node:test";
import { expandSelectors, toEnvValue, ALL } from "./selectors.ts";

const catalog = {
	"mcp-rw-jira": ["jira_get_issue", "jira_search", "jira_add_comment"],
	grafana: ["query_prometheus", "query_loki_logs", "list_datasources"],
	terraform: ["search_providers"],
};

test("a bare server name passes through", () => {
	const r = expandSelectors(["grafana"], catalog);
	assert.deepEqual(r.expanded, ["grafana"]);
	assert.deepEqual(r.missing, []);
});

test("'*' expands to every server", () => {
	const r = expandSelectors([ALL], catalog);
	assert.deepEqual(r.expanded, ["mcp-rw-jira", "grafana", "terraform"]);
});

test("a server glob expands to matching servers", () => {
	const r = expandSelectors(["*jira*"], catalog);
	assert.deepEqual(r.expanded, ["mcp-rw-jira"]);
});

test("an exact server/tool selector passes through", () => {
	const r = expandSelectors(["grafana/query_prometheus"], catalog);
	assert.deepEqual(r.expanded, ["grafana/query_prometheus"]);
});

test("a tool glob expands to every matching tool", () => {
	const r = expandSelectors(["grafana/query_*"], catalog);
	assert.deepEqual(r.expanded, [
		"grafana/query_prometheus",
		"grafana/query_loki_logs",
	]);
});

test("an unknown server is reported as missing", () => {
	const r = expandSelectors(["nope"], catalog);
	assert.deepEqual(r.expanded, []);
	assert.deepEqual(r.missing, ["nope"]);
});

test("an unknown tool on a known server is reported as missing", () => {
	const r = expandSelectors(["grafana/nope"], catalog);
	assert.deepEqual(r.expanded, []);
	assert.deepEqual(r.missing, ["grafana/nope"]);
});

test("a glob matching nothing is reported as missing", () => {
	const r = expandSelectors(["grafana/zzz_*"], catalog);
	assert.deepEqual(r.missing, ["grafana/zzz_*"]);
});

test("duplicate selectors collapse", () => {
	const r = expandSelectors(
		["grafana/query_prometheus", "grafana/query_*"],
		catalog,
	);
	assert.deepEqual(r.expanded, [
		"grafana/query_prometheus",
		"grafana/query_loki_logs",
	]);
});

test("a whole-server selector absorbs that server's tool selectors", () => {
	const r = expandSelectors(["grafana/query_prometheus", "grafana"], catalog);
	assert.deepEqual(r.expanded, ["grafana"]);
});

test("a trailing slash means the whole server", () => {
	const r = expandSelectors(["grafana/"], catalog);
	assert.deepEqual(r.expanded, ["grafana"]);
});

test("toEnvValue returns the sentinel for an empty selection", () => {
	assert.equal(toEnvValue([]), "__none__");
});

test("toEnvValue joins selectors with commas", () => {
	assert.equal(toEnvValue(["a", "b/c"]), "a,b/c");
});

test("expansion never emits a comma that would split a selector", () => {
	const r = expandSelectors([ALL], catalog);
	for (const s of r.expanded) assert.ok(!s.includes(","));
});
