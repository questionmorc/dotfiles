import assert from "node:assert/strict";
import { test } from "node:test";
import { bandFor } from "./band.ts";

test("below 60% is normal", () => {
	assert.equal(bandFor(0, 272_000), undefined);
	assert.equal(bandFor(163_199, 272_000), undefined);
});

test("60% up to 80% is warning", () => {
	assert.equal(bandFor(163_200, 272_000), "warning");
	assert.equal(bandFor(217_599, 272_000), "warning");
});

test("80% and above is error", () => {
	assert.equal(bandFor(217_600, 272_000), "error");
	assert.equal(bandFor(272_000, 272_000), "error");
});

test("over the window is error", () => {
	assert.equal(bandFor(300_000, 250_000), "error");
});

test("unknown token count is normal", () => {
	assert.equal(bandFor(null, 272_000), undefined);
});

test("non-positive window is normal", () => {
	assert.equal(bandFor(100, 0), undefined);
});
