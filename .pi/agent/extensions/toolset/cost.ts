/**
 * Context cost of a direct-tool selection.
 *
 * Every direct tool ships its name, description, and input schema in the system
 * prompt on every turn. The linear fit below was derived by counting all 268
 * cached MCP tools against Anthropic's /v1/messages/count_tokens endpoint and
 * subtracting the fixed 496-token tool-system block: median error 6.9%, p90
 * 15.2%. It is a status-line estimate, not an exact count.
 */

const TOKENS_PER_CHAR = 0.28746;
const TOKENS_CONSTANT = 18.12;

export interface CachedTool {
	name: string;
	description?: string;
	inputSchema?: unknown;
}

export type ToolCache = Record<string, CachedTool[]>;

export interface Cost {
	tools: number;
	tokens: number;
}

function wireChars(tool: CachedTool): number {
	return JSON.stringify({
		name: tool.name,
		description: tool.description ?? "",
		input_schema: tool.inputSchema ?? {},
	}).length;
}

export function estimateTokens(tools: readonly CachedTool[]): number {
	let total = 0;
	for (const tool of tools) {
		total += TOKENS_PER_CHAR * wireChars(tool) + TOKENS_CONSTANT;
	}
	return Math.round(total);
}

export interface ToolRow {
	/** Prefixed name as the model sees it, e.g. `grafana_query_prometheus`. */
	name: string;
	server: string;
	tokens: number;
}

/** One row per tool in an already-expanded selection, in selection order. */
export function explode(
	expanded: readonly string[],
	cache: ToolCache,
): ToolRow[] {
	const rows: ToolRow[] = [];
	for (const [server, tool] of pick(expanded, cache)) {
		rows.push({
			name: `${server}_${tool.name}`,
			server,
			tokens: estimateTokens([tool]),
		});
	}
	return rows;
}

/** Cost of an already-expanded selection of `server` and `server/tool` entries. */
export function selectionCost(
	expanded: readonly string[],
	cache: ToolCache,
): Cost {
	const picked = pick(expanded, cache).map(([, tool]) => tool);
	return { tools: picked.length, tokens: estimateTokens(picked) };
}

function pick(
	expanded: readonly string[],
	cache: ToolCache,
): [string, CachedTool][] {
	const picked: [string, CachedTool][] = [];

	for (const entry of expanded) {
		const slash = entry.indexOf("/");
		const server = slash === -1 ? entry : entry.slice(0, slash);
		const tools = cache[server];
		if (!tools) continue;

		if (slash === -1) {
			for (const tool of tools) picked.push([server, tool]);
			continue;
		}
		const wanted = entry.slice(slash + 1);
		const found = tools.find((tool) => tool.name === wanted);
		if (found) picked.push([server, found]);
	}

	return picked;
}

export function formatTokens(count: number): string {
	if (count < 1000) return String(count);
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	return `${Math.round(count / 1000)}k`;
}
