import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const agentDir = mkdtempSync(join(tmpdir(), "toolset-cmd-"));
writeFileSync(
	join(agentDir, "toolsets.json"),
	JSON.stringify({
		defaultToolset: "none",
		toolsets: {
			none: { description: "proxy only", mcp: [] },
			jira: { description: "all jira", mcp: ["srv-jira"] },
			everything: { description: "all of it", mcp: ["*"] },
		},
	}),
);
writeFileSync(
	join(agentDir, "mcp-cache.json"),
	JSON.stringify({
		servers: {
			"srv-jira": {
				tools: [
					{ name: "get_issue", description: "g".repeat(400) },
					{ name: "search", description: "s".repeat(400) },
				],
			},
			"srv-graf": { tools: [{ name: "query", description: "q".repeat(400) }] },
		},
	}),
);
process.env.PI_CODING_AGENT_DIR = agentDir;
delete process.env.MCP_DIRECT_TOOLS;
delete process.env.PI_TOOLSET_ACTIVE;

const { default: install } = await import("./index.ts");

interface Captured {
	handler: (args: string, ctx: unknown) => Promise<void>;
	completions: (prefix: string) => { value: string }[] | null;
}

function boot(): { captured: Captured; notices: [string, string][] } {
	const notices: [string, string][] = [];
	let captured: Captured | undefined;
	const pi = {
		registerFlag: () => {},
		on: () => () => {},
		appendEntry: () => {},
		registerCommand: (_name: string, spec: Record<string, unknown>) => {
			captured = {
				handler: spec.handler as Captured["handler"],
				completions: spec.getArgumentCompletions as Captured["completions"],
			};
		},
	};
	install(pi as never);
	if (!captured) throw new Error("command was not registered");
	return { captured, notices };
}

function context(notices: [string, string][]) {
	return {
		cwd: agentDir,
		ui: {
			notify: (message: string, level: string) => notices.push([message, level]),
			setStatus: () => {},
		},
		sessionManager: { getEntries: () => [] },
	};
}

test("`tools <name>` lists a toolset without activating it", async () => {
	const { captured, notices } = boot();
	await captured.handler("tools everything", context(notices));
	const [message, level] = notices.at(-1)!;
	assert.equal(level, "info");
	assert.match(message, /srv-jira_get_issue/);
	assert.match(message, /srv-graf_query/);
	assert.equal(process.env.PI_TOOLSET_ACTIVE, "none");
});

test("`tools` with no name falls back to the active set", async () => {
	const { captured, notices } = boot();
	await captured.handler("tools", context(notices));
	assert.match(notices.at(-1)![0], /exposes no direct tools/);
});

test("`tools <unknown>` reports the name, not a switch attempt", async () => {
	const { captured, notices } = boot();
	await captured.handler("tools ghost", context(notices));
	const [message, level] = notices.at(-1)!;
	assert.equal(level, "error");
	assert.equal(message, "toolset: unknown ghost");
});

test("`tools jira` scopes to that server only", async () => {
	const { captured, notices } = boot();
	await captured.handler("tools jira", context(notices));
	const message = notices.at(-1)![0];
	assert.match(message, /srv-jira_get_issue/);
	assert.doesNotMatch(message, /srv-graf_query/);
});

test("completions after `tools ` offer toolset names", () => {
	const { captured } = boot();
	const items = captured.completions("tools ev") ?? [];
	assert.deepEqual(
		items.map((i) => i.value),
		["tools everything"],
	);
});

test("completions after `set ` still offer set, not tools", () => {
	const { captured } = boot();
	const items = captured.completions("set ji") ?? [];
	assert.deepEqual(
		items.map((i) => i.value),
		["set jira"],
	);
});

test("`list` prices every toolset", async () => {
	const { captured, notices } = boot();
	await captured.handler("list", context(notices));
	const message = notices.at(-1)![0];
	for (const name of ["none", "jira", "everything"]) {
		assert.match(message, new RegExp(name));
	}
});
