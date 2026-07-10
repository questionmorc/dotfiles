/**
 * context-tokens Extension — absolute context size in the footer status line
 *
 * The built-in footer only shows context usage as a percentage of the model's
 * context window, e.g. "45.6%/200k". This extension adds a status line under
 * the footer with the RAW current-context token count, so you never have to do
 * the percent-times-window math yourself:
 *
 *     ctx 45.2k/200k
 *
 * The number comes from ctx.getContextUsage(), the same source the built-in
 * percentage uses, so it stays consistent with the footer. Right after a
 * /compact the exact count is unknown until the next model response, so it
 * shows "ctx ?/200k" during that gap.
 *
 * Placement: adds an extra footer line via ctx.ui.setStatus (does NOT replace
 * the built-in footer). Refreshes on the session/turn/message/compaction
 * events that change context size.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const STATUS_KEY = "context-tokens";

/** Compact token formatting, matching pi's own footer style. */
function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

export default function (pi: ExtensionAPI) {
	const update = (ctx: ExtensionContext) => {
		const usage = ctx.getContextUsage();
		if (!usage || usage.contextWindow <= 0) {
			ctx.ui.setStatus(STATUS_KEY, undefined);
			return;
		}
		const window = formatTokens(usage.contextWindow);
		// tokens is null right after a compaction until the next model response.
		const current = usage.tokens === null ? "?" : formatTokens(usage.tokens);
		ctx.ui.setStatus(STATUS_KEY, `ctx ${current}/${window}`);
	};

	// Refresh whenever context size can change.
	pi.on("session_start", async (_event, ctx) => update(ctx));
	pi.on("turn_end", async (_event, ctx) => update(ctx));
	pi.on("message_end", async (_event, ctx) => update(ctx));
	pi.on("session_compact", async (_event, ctx) => update(ctx));
	pi.on("model_select", async (_event, ctx) => update(ctx));
}
