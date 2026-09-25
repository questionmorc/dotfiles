/**
 * toolsets.json loading and `extends` resolution.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ToolsetDef {
	description?: string;
	extends?: string[];
	/** MCP selectors: `server`, `server/tool`, or globs over either. */
	mcp?: string[];
	/** Reserved for gating pi and extension tools. Not yet implemented. */
	tools?: string[];
	/** Reserved for gating pi and extension tools. Not yet implemented. */
	excludeTools?: string[];
}

export interface ToolsetsConfig {
	defaultToolset?: string;
	toolsets?: Record<string, ToolsetDef>;
}

export interface Resolution {
	names: string[];
	selectors: string[];
	unknown: string[];
}

export function agentDir(): string {
	return process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
}

function readJson(path: string): ToolsetsConfig | null {
	if (!existsSync(path)) return null;
	try {
		return JSON.parse(readFileSync(path, "utf8")) as ToolsetsConfig;
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		console.warn(`toolset: ignoring ${path} (${detail})`);
		return null;
	}
}

/** Global config, overlaid with `<cwd>/.pi/toolsets.json` when present. */
export function loadConfig(cwd: string): ToolsetsConfig {
	const global = readJson(join(agentDir(), "toolsets.json")) ?? {};
	const project = readJson(join(cwd, ".pi", "toolsets.json"));
	if (!project) return global;
	return {
		defaultToolset: project.defaultToolset ?? global.defaultToolset,
		toolsets: { ...global.toolsets, ...project.toolsets },
	};
}

export function parseNames(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((name) => name.trim())
		.filter(Boolean);
}

/** Union the MCP selectors of the named toolsets, parents first. */
export function resolveToolsets(
	config: ToolsetsConfig,
	names: readonly string[],
): Resolution {
	const defs = config.toolsets ?? {};
	const selectors: string[] = [];
	const seen = new Set<string>();
	const unknown: string[] = [];
	const visiting = new Set<string>();

	const add = (selector: string) => {
		if (seen.has(selector)) return;
		seen.add(selector);
		selectors.push(selector);
	};

	const walk = (name: string) => {
		if (visiting.has(name)) return;
		const def = defs[name];
		if (!def) {
			if (!unknown.includes(name)) unknown.push(name);
			return;
		}
		visiting.add(name);
		for (const parent of def.extends ?? []) walk(parent);
		for (const selector of def.mcp ?? []) add(selector);
		visiting.delete(name);
	};

	const resolved: string[] = [];
	for (const name of names) {
		if (!defs[name]) {
			if (!unknown.includes(name)) unknown.push(name);
			continue;
		}
		resolved.push(name);
		walk(name);
	}

	return { names: resolved, selectors, unknown };
}
