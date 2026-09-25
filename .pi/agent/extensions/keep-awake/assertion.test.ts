import assert from "node:assert/strict";
import { test } from "node:test";
import { SleepAssertion, type AssertionProcess } from "./assertion.ts";

function fakeProcess() {
	const listeners: Array<() => void> = [];
	let kills = 0;
	const proc: AssertionProcess = {
		kill: () => {
			kills++;
		},
		onExit: (listener) => {
			listeners.push(listener);
		},
	};
	return {
		proc,
		get kills() {
			return kills;
		},
		exit: () => {
			for (const listener of listeners) listener();
		},
	};
}

function spawner() {
	const spawned: Array<ReturnType<typeof fakeProcess>> = [];
	const spawn = () => {
		const next = fakeProcess();
		spawned.push(next);
		return next.proc;
	};
	return { spawn, spawned };
}

test("acquire spawns the holder process", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();

	assert.equal(spawned.length, 1);
	assert.equal(assertion.held, true);
});

test("acquire while held does not spawn a second holder", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	assertion.acquire();

	assert.equal(spawned.length, 1);
});

test("release kills the holder", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	assertion.release();

	assert.equal(spawned[0].kills, 1);
	assert.equal(assertion.held, false);
});

test("release without a holder is a no-op", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.release();

	assert.equal(spawned.length, 0);
	assert.equal(assertion.held, false);
});

test("release twice kills the holder once", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	assertion.release();
	assertion.release();

	assert.equal(spawned[0].kills, 1);
});

test("acquire after release spawns a fresh holder", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	assertion.release();
	assertion.acquire();

	assert.equal(spawned.length, 2);
	assert.equal(assertion.held, true);
});

test("a holder that exits on its own releases the hold", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	spawned[0].exit();

	assert.equal(assertion.held, false);
});

test("acquire respawns after the holder died on its own", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	spawned[0].exit();
	assertion.acquire();

	assert.equal(spawned.length, 2);
	assert.equal(spawned[0].kills, 0);
});

test("a dead holder is not killed on release", () => {
	const { spawn, spawned } = spawner();
	const assertion = new SleepAssertion(spawn);

	assertion.acquire();
	spawned[0].exit();
	assertion.release();

	assert.equal(spawned[0].kills, 0);
});

test("a failing spawner leaves nothing held", () => {
	const assertion = new SleepAssertion(() => {
		throw new Error("spawn failed");
	});

	assert.throws(() => assertion.acquire());
	assert.equal(assertion.held, false);
});
