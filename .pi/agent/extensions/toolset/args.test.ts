import assert from "node:assert/strict";
import { test } from "node:test";
import { flagFromArgv } from "./args.ts";

test("reads the separated form", () => {
	assert.equal(flagFromArgv(["pi", "--toolset", "on-call"]), "on-call");
});

test("reads the equals form", () => {
	assert.equal(flagFromArgv(["pi", "--toolset=on-call"]), "on-call");
});

test("reads an empty equals form as empty, not absent", () => {
	assert.equal(flagFromArgv(["pi", "--toolset="]), "");
});

test("returns undefined when the flag is absent", () => {
	assert.equal(flagFromArgv(["pi", "-p", "hello"]), undefined);
});

test("returns undefined when the flag has no value", () => {
	assert.equal(flagFromArgv(["pi", "--toolset"]), undefined);
});

test("ignores the flag after the -- terminator", () => {
	assert.equal(flagFromArgv(["pi", "--", "--toolset", "on-call"]), undefined);
});

test("does not match a flag that merely shares the prefix", () => {
	assert.equal(flagFromArgv(["pi", "--toolsets", "x"]), undefined);
});

test("the first occurrence wins", () => {
	assert.equal(flagFromArgv(["pi", "--toolset", "a", "--toolset", "b"]), "a");
});
