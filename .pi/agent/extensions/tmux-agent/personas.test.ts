import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { knownPersonaNames, resolvePersonaArg } from "./personas.ts";

const configFile = (body: string): string => {
	const path = join(mkdtempSync(join(tmpdir(), "tmux-agent-personas-")), "personas.json");
	writeFileSync(path, body);
	return path;
};

test("knownPersonaNames reads persona keys from a config", () => {
	const path = configFile(JSON.stringify({ personas: { base: {}, superpowers: {} } }));
	assert.deepEqual(knownPersonaNames([path]), ["base", "superpowers"]);
});

test("knownPersonaNames unions configs and dedupes", () => {
	const global = configFile(JSON.stringify({ personas: { base: {}, review: {} } }));
	const project = configFile(JSON.stringify({ personas: { review: {}, local: {} } }));
	assert.deepEqual(knownPersonaNames([global, project]), ["base", "review", "local"]);
});

test("knownPersonaNames skips missing and malformed configs", () => {
	const good = configFile(JSON.stringify({ personas: { base: {} } }));
	const broken = configFile("{ not json");
	assert.deepEqual(knownPersonaNames(["/nope/personas.json", broken, good]), ["base"]);
});

test("resolvePersonaArg splits, trims, and dedupes names", () => {
	const r = resolvePersonaArg(" base , superpowers ,base", ["base", "superpowers"]);
	assert.deepEqual(r, { names: ["base", "superpowers"], unknown: [] });
});

test("resolvePersonaArg reports unknown names", () => {
	const r = resolvePersonaArg("superpowers,bogus", ["base", "superpowers"]);
	assert.deepEqual(r, { names: ["superpowers", "bogus"], unknown: ["bogus"] });
});

test("resolvePersonaArg treats an empty arg as no persona", () => {
	assert.deepEqual(resolvePersonaArg("   ", ["base"]), { names: [], unknown: [] });
	assert.deepEqual(resolvePersonaArg(undefined, ["base"]), { names: [], unknown: [] });
});

test("resolvePersonaArg skips validation when no configs were found", () => {
	assert.deepEqual(resolvePersonaArg("anything", []), { names: ["anything"], unknown: [] });
});
