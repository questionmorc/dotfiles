/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before running potentially dangerous bash commands.
 * Patterns checked: rm -rf, sudo, chmod/chown 777
 *
 * Vendored from the bundled pi example, kept verbatim so it's easy to diff
 * against upstream. Extend `dangerousPatterns` to add your own guards.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	// Each entry gates a class of bash commands behind a Yes/No prompt.
	//
	// NOTE: these currently match the *whole* tool (all kubectl/az/git push
	// commands, read or write). A future iteration may scope this down so that
	// read-only subcommands (kubectl get/describe/logs, az ... list/show, etc.)
	// pass without prompting and only mutating commands are gated.
	const dangerousPatterns = [
		// Filesystem / privilege escalation (original example patterns)
		/\brm\s+(-rf?|--recursive)/i,
		/\bsudo\b/i,
		/\b(chmod|chown)\b.*777/i,

		// git push (any form: push, push --force, push origin, etc.)
		/\bgit\s+push\b/i,

		// Kubernetes: all kubectl commands, as a command token
		// (start of line or after a shell separator: ; | && ||)
		/(?:^|[\n;|&]|&&|\|\|)\s*kubectl\b/i,

		// Azure CLI: all `az` commands (require a following subcommand token
		// to avoid matching a bare "az" used as an argument value)
		/(?:^|[\n;|&]|&&|\|\|)\s*az\s+\S/i,
	];

	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return undefined;

		const command = event.input.command as string;
		const isDangerous = dangerousPatterns.some((p) => p.test(command));

		if (isDangerous) {
			if (!ctx.hasUI) {
				// In non-interactive mode, block by default
				return { block: true, reason: "Dangerous command blocked (no UI for confirmation)" };
			}

			const choice = await ctx.ui.select(`⚠️ Dangerous command:\n\n  ${command}\n\nAllow?`, ["Yes", "No"]);

			if (choice !== "Yes") {
				return { block: true, reason: "Blocked by user" };
			}
		}

		return undefined;
	});
}
