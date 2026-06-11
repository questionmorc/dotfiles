/**
 * tmux-agent Extension — spawn_agent tool + /spawn command
 *
 * Hand off the current pi session to a new agent in a named tmux window or
 * session. The LLM parses a freeform request into structured parameters and
 * calls the `spawn_agent` tool, which runs the engine non-interactively
 * (--no-prompt), so NO fzf window appears for this path.
 *
 * Usage:
 *   /spawn fork this into a window called auth-fix and wait
 *   /spawn fresh agent to write integration tests, new session, auto
 *
 * The /spawn command routes your text to the agent, which extracts the params
 * and calls spawn_agent. The agent may ask a clarifying question only if the
 * request is ambiguous; otherwise it just spawns.
 *
 * (The tmux keybind Ctrl+Space a still uses the interactive fzf flow.)
 *
 * Why an extension: the tool's execution is deterministic JS, and it knows the
 * *current* session file, so "fork" forks the exact conversation you're in.
 *
 * Requires: running inside tmux.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const ENGINE = join(homedir(), ".local", "bin", "tmux-agent");

/** Extract the session UUID from a pi session file path (<ts>_<uuid>.jsonl). */
function sessionIdFromFile(file: string | undefined): string | undefined {
	if (!file) return undefined;
	const base = basename(file).replace(/\.jsonl$/, "");
	const underscore = base.indexOf("_");
	const id = underscore >= 0 ? base.slice(underscore + 1) : base;
	return id || undefined;
}

/** Slugify text into a tmux-safe default name (mirror of the engine's slugify). */
function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.split(/\s+/)
		.slice(0, 4)
		.join("-");
}

const SpawnParams = Type.Object({
	mode: StringEnum(["fork", "fresh"] as const, {
		description:
			"fork = the new agent inherits THIS session's full conversation history; fresh = a blank agent (optionally seeded with `task`).",
	}),
	placement: StringEnum(["window", "session"] as const, {
		description:
			"window = a new tmux window in the current session; session = a brand new tmux session.",
	}),
	launch: StringEnum(["auto", "wait"] as const, {
		description:
			"auto = send the task to the new agent immediately; wait = pre-fill the input but do not send (user reviews and presses Enter). Use wait when unsure.",
	}),
	name: Type.Optional(
		Type.String({
			description:
				"Name for the new window/session. If omitted, derived from the task or defaults to 'agent'. Spaces/dots/slashes are sanitised to underscores.",
		}),
	),
	task: Type.Optional(
		Type.String({
			description:
				"For mode=fresh: the initial prompt/task for the new agent. Ignored for mode=fork.",
		}),
	),
	workdir: Type.Optional(
		Type.String({
			description:
				"Absolute working directory for the new agent. Defaults to the current session's cwd.",
		}),
	),
});

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "spawn_agent",
		label: "Spawn Agent",
		description:
			"Hand off to a new pi agent in a named tmux window or session. Parse the user's request into the parameters: pick mode (fork=carry this conversation, fresh=blank), placement (window/session), launch (auto/wait), and optional name/task/workdir. Call this when the user runs /spawn or asks to hand off / spawn / fork the session into a new tmux window or session.",
		parameters: SpawnParams,

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (!process.env.TMUX) {
				return {
					content: [{ type: "text", text: "Error: /spawn requires running inside tmux." }],
					isError: true,
				};
			}

			const flags = ["--no-prompt", "--mode", params.mode, "--placement", params.placement, "--launch", params.launch];

			// Workdir: explicit or current cwd.
			const workdir = params.workdir?.trim() || ctx.cwd;
			flags.push("--workdir", workdir);

			// Name: explicit, else slug from task, else 'agent'.
			const name = (params.name?.trim() || slugify(params.task ?? "agent") || "agent");
			flags.push("--name", name);

			if (params.mode === "fork") {
				const sessionId = sessionIdFromFile(ctx.sessionManager.getSessionFile());
				if (!sessionId) {
					return {
						content: [
							{
								type: "text",
								text: "Error: cannot fork — this session is ephemeral (no saved session file). Use mode=fresh instead.",
							},
						],
						isError: true,
					};
				}
				flags.push("--session", sessionId);
			} else if (params.task?.trim()) {
				flags.push("--task", params.task.trim());
			}

			const result = await pi.exec(ENGINE, flags, { timeout: 30000 });
			if (result.code !== 0 && !result.killed) {
				return {
					content: [
						{
							type: "text",
							text: `spawn_agent failed (exit ${result.code}): ${result.stderr || result.stdout || "no output"}`,
						},
					],
					isError: true,
				};
			}

			return {
				content: [
					{
						type: "text",
						text: `Spawned ${params.mode} agent in ${params.placement} "${name}" (launch=${params.launch}, cwd=${workdir}).`,
					},
				],
				details: { mode: params.mode, placement: params.placement, launch: params.launch, name, workdir },
			};
		},
	});

	// /spawn routes freeform text to the agent, which parses it and calls spawn_agent.
	pi.registerCommand("spawn", {
		description: "Hand off to a new tmux agent. e.g. /spawn fork into a window called auth-fix and wait",
		handler: async (args, ctx) => {
			if (!process.env.TMUX) {
				ctx.ui.notify("/spawn requires running inside tmux", "error");
				return;
			}
			const request = (args ?? "").trim();
			const instruction = request
				? `The user wants to spawn a new tmux agent. Parse this request and call the spawn_agent tool: "${request}". ` +
					"Infer mode (fork if they want this conversation's context, fresh otherwise), placement (window unless they say session), and launch (wait unless they say auto/immediately). " +
					"If a name is mentioned use it; otherwise omit it. Only ask a clarifying question if the request is genuinely ambiguous. Do not narrate, just call the tool."
				: "The user ran /spawn with no arguments. Call the spawn_agent tool to hand off this session. Default to mode=fork, placement=window, launch=wait unless context suggests otherwise. Do not narrate, just call the tool.";

			pi.sendUserMessage(instruction);
		},
	});
}
