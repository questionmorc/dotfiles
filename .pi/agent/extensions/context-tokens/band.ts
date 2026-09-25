export type Band = "warning" | "error";

const WARNING_RATIO = 0.6;
const ERROR_RATIO = 0.8;

export function bandFor(tokens: number | null, contextWindow: number): Band | undefined {
	if (tokens === null || contextWindow <= 0) return undefined;
	const ratio = tokens / contextWindow;
	if (ratio >= ERROR_RATIO) return "error";
	if (ratio >= WARNING_RATIO) return "warning";
	return undefined;
}
