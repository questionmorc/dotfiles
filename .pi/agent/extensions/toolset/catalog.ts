/**
 * Reads pi-mcp-adapter's metadata cache. Direct tools are registered from this
 * same file (direct-tool-surface.ts resolveDirectTools), so it is the right
 * source for both selector expansion and cost estimates.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Catalog } from "./selectors.ts";
import type { CachedTool, ToolCache } from "./cost.ts";
import { agentDir } from "./resolve.ts";

interface CacheFile {
	servers?: Record<string, { tools?: CachedTool[] }>;
}

export interface Snapshot {
	catalog: Catalog;
	cache: ToolCache;
	path: string;
	present: boolean;
}

export function loadSnapshot(): Snapshot {
	const path = join(agentDir(), "mcp-cache.json");
	const empty: Snapshot = { catalog: {}, cache: {}, path, present: false };
	if (!existsSync(path)) return empty;

	let parsed: CacheFile;
	try {
		parsed = JSON.parse(readFileSync(path, "utf8")) as CacheFile;
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		console.warn(`toolset: ignoring ${path} (${detail})`);
		return empty;
	}

	const catalog: Catalog = {};
	const cache: ToolCache = {};
	for (const [server, entry] of Object.entries(parsed.servers ?? {})) {
		const tools = entry.tools ?? [];
		catalog[server] = tools.map((tool) => tool.name);
		cache[server] = tools;
	}
	return { catalog, cache, path, present: true };
}
