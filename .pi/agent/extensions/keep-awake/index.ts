/**
 * keep-awake Extension — stop macOS idle sleep from freezing a running agent
 *
 * The Mac's power profile sleeps the machine one minute after the display
 * sleeps, which freezes every process and kills the in-flight provider stream,
 * so an agent left alone dies mid-turn. This holds `caffeinate -i` for exactly
 * as long as the agent is running: idle sleep is blocked while a turn is in
 * flight and allowed again the moment pi settles.
 *
 * Display sleep and the lock screen are untouched, so walking away still locks
 * the screen. `-i` cannot beat a closed lid on battery; for that, run the agent
 * on a host that does not sleep.
 *
 * The holder is `caffeinate -i -w <pi pid>`, so the assertion is released even
 * if pi is killed without running its shutdown path.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { SleepAssertion, type AssertionProcess } from "./assertion.ts";

const CAFFEINATE = "/usr/bin/caffeinate";

function spawnCaffeinate(): AssertionProcess {
	const child = spawn(CAFFEINATE, ["-i", "-w", String(process.pid)], {
		stdio: "ignore",
	});
	child.unref();
	return {
		kill: () => {
			child.kill("SIGTERM");
		},
		onExit: (listener) => {
			child.once("exit", listener);
			child.once("error", listener);
		},
	};
}

export default function (pi: ExtensionAPI) {
	if (process.platform !== "darwin") return;

	const assertion = new SleepAssertion(spawnCaffeinate);

	pi.on("agent_start", async () => {
		try {
			assertion.acquire();
		} catch {
			// Ignore a missing or blocked caffeinate.
		}
	});
	pi.on("agent_settled", async () => {
		assertion.release();
	});
	pi.on("session_shutdown", async () => {
		assertion.release();
	});
}
