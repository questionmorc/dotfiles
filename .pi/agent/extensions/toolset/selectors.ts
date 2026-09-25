/**
 * Selector expansion for MCP_DIRECT_TOOLS.
 *
 * pi-mcp-adapter matches env selectors literally (metadata-cache.ts
 * parseDirectToolSelectors + direct-tool-surface.ts resolveDirectTools), so
 * globs must be expanded here before the value reaches the environment.
 */

/** Selector meaning "every configured server". */
export const ALL = "*";

/** Server name -> that server's original (unprefixed) tool names. */
export type Catalog = Record<string, string[]>;

export interface Expansion {
	expanded: string[];
	missing: string[];
}

function globToRegExp(pattern: string): RegExp {
	const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`);
}

function isGlob(value: string): boolean {
	return value.includes("*") || value.includes("?");
}

function matchNames(pattern: string, names: string[]): string[] {
	if (!isGlob(pattern)) return names.includes(pattern) ? [pattern] : [];
	const re = globToRegExp(pattern);
	return names.filter((name) => re.test(name));
}

/**
 * Resolve selectors against a catalog into literal `server` and `server/tool`
 * entries. Unmatched selectors are reported rather than silently dropped.
 */
export function expandSelectors(
	selectors: readonly string[],
	catalog: Catalog,
): Expansion {
	const servers = Object.keys(catalog);
	const wholeServers = new Set<string>();
	const tools = new Set<string>();
	const missing: string[] = [];

	for (const raw of selectors) {
		const selector = raw.trim();
		if (!selector) continue;

		const slash = selector.indexOf("/");
		const serverPart = slash === -1 ? selector : selector.slice(0, slash);
		const toolPart = slash === -1 ? "" : selector.slice(slash + 1);

		const matchedServers = matchNames(
			serverPart === ALL ? ALL : serverPart,
			servers,
		);
		if (matchedServers.length === 0) {
			missing.push(selector);
			continue;
		}

		if (!toolPart) {
			for (const server of matchedServers) wholeServers.add(server);
			continue;
		}

		let matchedAnyTool = false;
		for (const server of matchedServers) {
			for (const tool of matchNames(toolPart, catalog[server] ?? [])) {
				tools.add(`${server}/${tool}`);
				matchedAnyTool = true;
			}
		}
		if (!matchedAnyTool) missing.push(selector);
	}

	// A whole-server selection already covers that server's tools; keeping both
	// would hand the adapter a redundant tool list that it filters anyway.
	const expanded = [
		...servers.filter((server) => wholeServers.has(server)),
		...[...tools].filter(
			(entry) => !wholeServers.has(entry.slice(0, entry.indexOf("/"))),
		),
	];

	return { expanded, missing };
}

/** Render an expanded selection as an MCP_DIRECT_TOOLS value. */
export function toEnvValue(expanded: readonly string[]): string {
	return expanded.length === 0 ? "__none__" : expanded.join(",");
}
