import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { expandPath, resolvePromptValue } from "./prompt-source.ts";

const scratch = () => mkdtempSync(join(tmpdir(), "personas-prompt-"));

const fixture = (body: string, name = "SKILL.md"): string => {
	const dir = scratch();
	const path = join(dir, name);
	writeFileSync(path, body);
	return path;
};

test("expandPath resolves a bare tilde", () => {
	assert.equal(expandPath("~"), homedir());
});

test("expandPath resolves a tilde prefix", () => {
	assert.equal(expandPath("~/x/y.md"), join(homedir(), "x/y.md"));
});

test("expandPath leaves other paths untouched", () => {
	assert.equal(expandPath("  /tmp/a.md  "), "/tmp/a.md");
});

test("plain text is returned trimmed", () => {
	assert.deepEqual(resolvePromptValue("  Be terse.  "), { text: "Be terse." });
});

test("an @ inside the text does not trigger a file read", () => {
	const value = "Ping me@example.com";
	assert.deepEqual(resolvePromptValue(value), { text: value });
});

test("@path reads the file body", () => {
	const path = fixture("Do the thing.\n");
	assert.deepEqual(resolvePromptValue(`@${path}`), { text: "Do the thing." });
});

test("@path strips YAML frontmatter", () => {
	const path = fixture("---\nname: x\ndescription: y\n---\n\nDo the thing.\n");
	assert.deepEqual(resolvePromptValue(`@${path}`), { text: "Do the thing." });
});

test("@path keeps a body whose horizontal rule is not frontmatter", () => {
	const path = fixture("Intro\n\n---\n\nOutro\n");
	assert.deepEqual(resolvePromptValue(`@${path}`), {
		text: "Intro\n\n---\n\nOutro",
	});
});

test("@~/path expands the home directory", () => {
	const calls: string[] = [];
	const readFile = (p: string) => {
		calls.push(p);
		return "body";
	};
	assert.deepEqual(resolvePromptValue("@~/notes/x.md", { readFile }), {
		text: "body",
	});
	assert.deepEqual(calls, [join(homedir(), "notes/x.md")]);
});

test("a relative @path resolves against baseDir", () => {
	const dir = scratch();
	writeFileSync(join(dir, "rules.md"), "local rules");
	assert.deepEqual(resolvePromptValue("@rules.md", { baseDir: dir }), {
		text: "local rules",
	});
});

test("a missing @path reports an error and no text", () => {
	const result = resolvePromptValue("@/nope/missing.md");
	assert.equal(result.text, "");
	assert.match(result.error ?? "", /\/nope\/missing\.md/);
});

test("an empty @path reports an error", () => {
	const result = resolvePromptValue("@");
	assert.equal(result.text, "");
	assert.match(result.error ?? "", /empty/i);
});
