/**
 * toolset - named profiles of MCP tools, applied before pi-mcp-adapter loads.
 *
 * Every direct MCP tool costs its name, description, and schema in the system
 * prompt on every turn. A toolset names the subset worth paying for.
 *
 * Mechanism: pi-mcp-adapter reads MCP_DIRECT_TOOLS at factory time and, when it
 * is set, ignores every `directTools` field in mcp.json
 * (direct-tool-surface.ts resolveDirectTools). Personal extensions load before
 * package extensions, so writing the variable in this factory takes effect on
 * the first turn with no reload.
 *
 * Launch:   pi --toolset observability
 *           pi --toolset base,on-call        (union)
 *           pi                                (loads defaultToolset)
 *
 * In session:
 *           /toolset                 show active + available
 *           /toolset list            every toolset with its description and cost
 *           /toolset tools           the tools the active set resolves to
 *           /toolset set a,b         replace the active set (reloads)
 *           /toolset reset           back to defaultToolset
 *
 * Config: ~/.pi/agent/toolsets.json merged with <cwd>/.pi/toolsets.json.
 *
 * Escape hatch: export MCP_DIRECT_TOOLS yourself and this extension stands down
 * unless you pass --toolset. With no resolvable toolset it stays inert and
 * mcp.json keeps control.
 */

import type { AutocompleteItem } from "@earendil-works/pi-tui";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { flagFromArgv } from "./args.ts";
import { loadSnapshot } from "./catalog.ts";
import { explode, formatTokens, selectionCost } from "./cost.ts";
import type { Cost } from "./cost.ts";
import { loadConfig, parseNames, resolveToolsets } from "./resolve.ts";
import type { ToolsetsConfig } from "./resolve.ts";
import { expandSelectors, toEnvValue } from "./selectors.ts";

const STATE_TYPE = "toolset:state";
/** Process-scoped active set. Survives /reload so the factory stays authoritative. */
const ACTIVE_ENV = "PI_TOOLSET_ACTIVE";
const DIRECT_ENV = "MCP_DIRECT_TOOLS";

interface Activation {
	names: string[];
	expanded: string[];
	unknown: string[];
	missing: string[];
	cost: Cost;
}

function activate(config: ToolsetsConfig, names: string[]): Activation {
	const { catalog, cache } = loadSnapshot();
	const resolution = resolveToolsets(config, names);
	const { expanded, missing } = expandSelectors(resolution.selectors, catalog);
	return {
		names: resolution.names,
		expanded,
		unknown: resolution.unknown,
		missing,
		cost: selectionCost(expanded, cache),
	};
}

function readLatestCustom<T>(ctx: ExtensionContext, type: string): T | undefined {
	let found: T | undefined;
	for (const entry of ctx.sessionManager.getEntries()) {
		if (
			entry.type === "custom" &&
			(entry as { customType?: string }).customType === type
		) {
			found = (entry as { data?: T }).data;
		}
	}
	return found;
}

function label(names: string[]): string {
	return names.length ? names.join(",") : "(none)";
}

function summary(activation: Activation): string {
	const { tools, tokens } = activation.cost;
	if (tools === 0) return `${label(activation.names)} [proxy only]`;
	return `${label(activation.names)} [${tools} tool${tools === 1 ? "" : "s"} ~${formatTokens(tokens)}]`;
}

// ---------------------------------------------------------------------------
// Factory. Runs before pi-mcp-adapter, which is the whole point.
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	pi.registerFlag?.("toolset", {
		description:
			"Comma-separated MCP toolset(s) to activate at launch (see ~/.pi/agent/toolsets.json)",
		type: "string",
	});

	const flagValue = flagFromArgv(process.argv);
	const bootConfig = loadConfig(process.cwd());
	const userPinnedEnv =
		process.env[DIRECT_ENV] !== undefined &&
		process.env[ACTIVE_ENV] === undefined &&
		flagValue === undefined;

	let bootNames = parseNames(process.env[ACTIVE_ENV] ?? flagValue);
	if (bootNames.length === 0 && bootConfig.defaultToolset) {
		bootNames = [bootConfig.defaultToolset];
	}

	// Inert until a toolset actually resolves: an empty selection would silently
	// strip every direct tool that mcp.json configured.
	const boot = activate(bootConfig, bootNames);
	const owned = boot.names.length > 0 && !userPinnedEnv;
	if (owned) {
		process.env[DIRECT_ENV] = toEnvValue(boot.expanded);
		process.env[ACTIVE_ENV] = boot.names.join(",");
	}

	let cache: Activation | null = null;

	function current(ctx: ExtensionContext | ExtensionCommandContext): Activation {
		if (cache) return cache;
		const config = loadConfig(ctx.cwd);
		const names = parseNames(process.env[ACTIVE_ENV]);
		cache = activate(config, names.length ? names : bootNames);
		return cache;
	}

	function renderStatus(ctx: ExtensionContext, activation: Activation): void {
		ctx.ui.setStatus("toolset", `toolset: ${summary(activation)}`);
	}

	async function switchTo(
		ctx: ExtensionCommandContext,
		names: string[],
	): Promise<void> {
		const config = loadConfig(ctx.cwd);
		const next = activate(config, names);
		if (next.unknown.length) {
			ctx.ui.notify(`toolset: unknown ${next.unknown.join(", ")}`, "error");
			return;
		}
		if (next.missing.length) {
			ctx.ui.notify(
				`toolset: no match for ${next.missing.join(", ")}`,
				"warning",
			);
		}
		process.env[DIRECT_ENV] = toEnvValue(next.expanded);
		process.env[ACTIVE_ENV] = next.names.join(",");
		pi.appendEntry(STATE_TYPE, { active: next.names });
		cache = null;
		ctx.ui.notify(`toolset: switching to ${summary(next)}`, "info");
		await ctx.reload();
	}

	pi.on("session_start", async (_event, ctx) => {
		cache = null;
		const persisted = readLatestCustom<{ active: string[] }>(ctx, STATE_TYPE);
		const applied = parseNames(process.env[ACTIVE_ENV]);

		// A resumed session carries its own toolset. Re-apply it and reload once;
		// the factory then reads ACTIVE_ENV and this branch stops firing.
		if (
			persisted &&
			persisted.active.length > 0 &&
			persisted.active.join(",") !== applied.join(",") &&
			!flagValue &&
			!userPinnedEnv
		) {
			const next = activate(loadConfig(ctx.cwd), persisted.active);
			if (next.names.length > 0) {
				process.env[DIRECT_ENV] = toEnvValue(next.expanded);
				process.env[ACTIVE_ENV] = next.names.join(",");
				cache = null;
				await ctx.reload();
				return;
			}
		}

		const activation = current(ctx);
		if (!persisted || persisted.active.join(",") !== activation.names.join(",")) {
			pi.appendEntry(STATE_TYPE, { active: activation.names });
		}

		if (activation.unknown.length) {
			ctx.ui.notify(
				`toolset: unknown ${activation.unknown.join(", ")}`,
				"error",
			);
		}
		if (userPinnedEnv) {
			ctx.ui.setStatus("toolset", `toolset: ${DIRECT_ENV} pinned`);
			return;
		}
		if (!owned && activation.names.length === 0) {
			ctx.ui.setStatus("toolset", "toolset: off (mcp.json)");
			return;
		}
		renderStatus(ctx, activation);
	});

	pi.registerCommand("toolset", {
		description: "Show or switch MCP tool profiles",
		// pi-tui replaces the entire argument text with the chosen value, so each
		// value carries the full argument line rather than just the token.
		getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
			const config = loadConfig(process.cwd());
			const names = Object.keys(config.toolsets ?? {});
			const items: AutocompleteItem[] = [];
			const subs = ["list", "tools", "set", "reset"];

			const nameMatch = /^(set|tools)\s+(.*)$/.exec(prefix);
			if (nameMatch) {
				const verb = nameMatch[1];
				const typed = nameMatch[2];
				const last = typed.split(",").pop() ?? "";
				const head = typed.slice(0, typed.length - last.length);
				for (const name of names.filter((n) => n.startsWith(last.trim()))) {
					items.push({
						value: `${verb} ${head}${name}`,
						label: name,
						description: config.toolsets?.[name]?.description ?? "",
					});
				}
				return items;
			}

			for (const sub of subs.filter((s) => s.startsWith(prefix))) {
				items.push({ value: sub, label: sub });
			}
			for (const name of names.filter((n) => n.startsWith(prefix))) {
				items.push({
					value: name,
					label: name,
					description: config.toolsets?.[name]?.description ?? "",
				});
			}
			return items.length ? items : null;
		},
		handler: async (args, ctx) => {
			const input = args.trim();
			const config = loadConfig(ctx.cwd);

			if (!input || input === "show") {
				const activation = current(ctx);
				const names = Object.keys(config.toolsets ?? {});
				ctx.ui.notify(
					`toolset: ${summary(activation)}\navailable: ${names.join(", ") || "(none configured)"}`,
					"info",
				);
				return;
			}

			if (input === "list") {
				const { catalog, cache: toolCache } = loadSnapshot();
				const rows = Object.entries(config.toolsets ?? {}).map(
					([name, def]) => {
						const resolved = resolveToolsets(config, [name]);
						const { expanded } = expandSelectors(resolved.selectors, catalog);
						const cost = selectionCost(expanded, toolCache);
						const price =
							cost.tools === 0
								? "proxy only"
								: `${cost.tools} tools ~${formatTokens(cost.tokens)}`;
						return [name, price, def.description ?? ""] as const;
					},
				);
				if (rows.length === 0) {
					ctx.ui.notify("toolset: none configured", "warning");
					return;
				}
				const w0 = Math.max(...rows.map((r) => r[0].length));
				const w1 = Math.max(...rows.map((r) => r[1].length));
				const body = rows
					.map(
						([n, p, d]) => `  ${n.padEnd(w0)}  ${p.padEnd(w1)}  ${d}`,
					)
					.join("\n");
				ctx.ui.notify(body, "info");
				return;
			}

			const toolsMatch = /^tools(?:\s+(.+))?$/.exec(input);
			if (toolsMatch) {
				const requested = parseNames(toolsMatch[1]);
				const activation = requested.length
					? activate(config, requested)
					: current(ctx);
				if (activation.unknown.length) {
					ctx.ui.notify(
						`toolset: unknown ${activation.unknown.join(", ")}`,
						"error",
					);
					return;
				}
				if (activation.expanded.length === 0) {
					ctx.ui.notify(
						`toolset: ${label(activation.names)} exposes no direct tools`,
						"info",
					);
					return;
				}
				const rows = explode(activation.expanded, loadSnapshot().cache);
				const width = Math.max(...rows.map((row) => row.name.length));
				const body = rows
					.map(
						(row) =>
							`  ${row.name.padEnd(width)}  ~${formatTokens(row.tokens)}`,
					)
					.join("\n");
				ctx.ui.notify(`${summary(activation)}\n${body}`, "info");
				return;
			}

			if (input === "reset") {
				const fallback = config.defaultToolset;
				if (!fallback) {
					ctx.ui.notify("toolset: no defaultToolset configured", "error");
					return;
				}
				await switchTo(ctx, [fallback]);
				return;
			}

			const setMatch = /^set\s+(.+)$/.exec(input);
			await switchTo(ctx, parseNames(setMatch ? setMatch[1] : input));
		},
	});
}
