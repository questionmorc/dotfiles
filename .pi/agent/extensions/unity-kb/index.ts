// unity-kb pi extension
//
// Thin TypeScript wrapper around the `kb` CLI. Gives pi:
//   - typed tools: kb_index, kb_search, kb_show, kb_backlinks, kb_list
//   - a /kb slash command with autocompletion
//   - prompt snippet + guideline so the agent knows the KB exists
//
// The extension does NOT re-implement search/parse logic. It shells out to
// `kb` via pi.exec(). That keeps one source of truth (the CLI) and keeps the
// CLI useful from the terminal.
//
// Requirements at runtime:
//   - `kb` is on PATH (the KB repo's bin/install symlinks it into ~/.local/bin)
//   - `kb` knows where the KB lives (it reads $KB_DIR, or follows its own
//     symlink back to <kb-repo>/bin/kb)
//
// This extension is therefore portable: it can live in dotfiles, a stow
// package, or anywhere else; it never assumes a particular path layout.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { spawn } from "node:child_process";

const KB_BIN = "kb";

// Run `kb note <topic>` with body piped on stdin. pi.exec doesn't take stdin,
// so use child_process directly. Tag the entry with KB_AGENT=pi for provenance.
function kbNote(topic: string, body: string, signal?: AbortSignal): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(KB_BIN, ["note", topic], {
      env: { ...process.env, KB_AGENT: "pi" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => (stdout += b.toString()));
    child.stderr.on("data", (b) => (stderr += b.toString()));
    const onAbort = () => child.kill("SIGTERM");
    signal?.addEventListener("abort", onAbort, { once: true });
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      resolve({ stdout, stderr, code: code ?? 0 });
    });
    child.stdin.end(body);
  });
}

type ExecResult = { stdout: string; stderr: string; code: number };

export default function (pi: ExtensionAPI) {
  // ---- helpers --------------------------------------------------------------

  async function kb(args: string[], signal?: AbortSignal): Promise<ExecResult> {
    const result = await pi.exec(KB_BIN, args, { signal });
    return {
      stdout: (result.stdout ?? "").toString(),
      stderr: (result.stderr ?? "").toString(),
      code: result.code ?? 0,
    };
  }

  function toolResult(r: ExecResult, emptyMessage = "(no output)") {
    if (r.code !== 0) {
      return {
        content: [{ type: "text" as const, text: r.stderr.trim() || `kb exited ${r.code}` }],
        details: { code: r.code, stderr: r.stderr },
        isError: true,
      };
    }
    const text = r.stdout.trim() || emptyMessage;
    return {
      content: [{ type: "text" as const, text }],
      details: { code: r.code },
    };
  }

  // ---- prompt hint ----------------------------------------------------------

  // One-line tool descriptions are always visible to the model. We add a small
  // shared promptGuideline to nudge the agent to start with kb_index / kb_search
  // before opening anything, only when these tools are active.
  const sharedGuideline =
    "Use kb_* tools to consult the Unity Muse / AI Authoring KB before answering questions about Muse, Generators (Proton), Nibbler, AI-Config, the AI Authoring team, or any of these repos: muse, muse-editor, proton-service, hadron-azure-terraform-proton, tech-azure-terraform-heyu, AiConfigurationService, pre-grafana, duke, kronus. Start with kb_index or kb_search; prefer kb_show with a #section over reading whole pages.";

  const noteGuideline =
    "If during a task you discover something worth filing in the Unity KB (a runbook detail, a deployment quirk, a decision, an undocumented invariant), use kb_note to drop a short observation under raw/agent-notes/. Do NOT edit wiki/ pages directly \u2014 the user curates those via /ingest. Always include the source (commit, PR, file path, Slack thread, doc URL) inside the note body so the user can verify before promoting it.";

  // ---- tools ----------------------------------------------------------------

  pi.registerTool({
    name: "kb_index",
    label: "KB Index",
    description:
      "Print the Unity KB routing table (wiki/index.md). One-line description per page. Read this first to find the slug you need.",
    promptSnippet: "List all Unity KB pages with one-line descriptions",
    promptGuidelines: [sharedGuideline],
    parameters: Type.Object({}),
    async execute(_id, _params, signal) {
      return toolResult(await kb(["index"], signal));
    },
  });

  pi.registerTool({
    name: "kb_search",
    label: "KB Search",
    description:
      "Search the Unity KB for pages mentioning a term (case-insensitive, full-text + filename). Returns 'type  slug  one-liner' lines. Use the slug with kb_show.",
    promptSnippet: "Search the Unity KB by keyword and return matching slugs",
    parameters: Type.Object({
      query: Type.String({ description: "Search term, e.g. 'release process' or 'nibbler'" }),
    }),
    async execute(_id, params, signal) {
      return toolResult(await kb(["search", params.query], signal), "(no matches)");
    },
  });

  pi.registerTool({
    name: "kb_show",
    label: "KB Show",
    description:
      "Show one Unity KB page by slug. Optionally show only one ## section by passing 'section'. Common sections on repo pages: purpose, key modules, how it connects, ownership, ci/cd, notes. Prefer a section over the whole page when you only need one part.",
    promptSnippet: "Read one Unity KB page (or a single section of it) by slug",
    parameters: Type.Object({
      slug: Type.String({ description: "Page slug, e.g. 'muse' or 'muse-testing'. From kb_index or kb_search." }),
      section: Type.Optional(
        Type.String({ description: "Optional ## heading name (case-insensitive). Omit to read the whole page." }),
      ),
    }),
    async execute(_id, params, signal) {
      const arg = params.section ? `${params.slug}#${params.section}` : params.slug;
      return toolResult(await kb(["show", arg], signal));
    },
  });

  pi.registerTool({
    name: "kb_backlinks",
    label: "KB Backlinks",
    description:
      "List KB pages that reference the given slug via [[wikilinks]]. Use this to see what depends on a system or who is mentioned where.",
    promptSnippet: "Find Unity KB pages that link to a given slug",
    parameters: Type.Object({
      slug: Type.String({ description: "Page slug to find backlinks for" }),
    }),
    async execute(_id, params, signal) {
      return toolResult(await kb(["backlinks", params.slug], signal), "(no backlinks)");
    },
  });

  pi.registerTool({
    name: "kb_list",
    label: "KB List",
    description: "List Unity KB pages, optionally filtered by type (repo, system, person, design, decision).",
    promptSnippet: "List Unity KB pages, optionally filtered by type",
    parameters: Type.Object({
      type: Type.Optional(
        StringEnum(["repo", "system", "person", "design", "decision", "session"] as const, {
          description: "Filter by page type. Omit to list everything.",
        }),
      ),
    }),
    async execute(_id, params, signal) {
      const args = params.type ? ["list", params.type] : ["list"];
      return toolResult(await kb(args, signal));
    },
  });

  pi.registerTool({
    name: "kb_note",
    label: "KB Note",
    description:
      "Append a drop-box note to the Unity KB under raw/agent-notes/. Use this to file an observation that the user can later promote into the wiki via /ingest. Do NOT use this for trivia or chat \u2014 only for things worth keeping. Always include the source (file path, commit, PR, Slack thread, doc URL) inside the body. Never edit wiki/ pages directly.",
    promptSnippet: "File an observation in the Unity KB drop-box for the user to ingest later",
    promptGuidelines: [noteGuideline],
    parameters: Type.Object({
      topic: Type.String({
        description: "Short kebab-case topic, e.g. 'flaky-extended-tests' or 'muse-staging-helm-quirk'. Becomes part of the filename.",
      }),
      body: Type.String({
        description: "Markdown body. Include what you observed, where, and the source so the user can verify it.",
      }),
    }),
    async execute(_id, params, signal) {
      const r = await kbNote(params.topic, params.body, signal);
      if (r.code !== 0) {
        return {
          content: [{ type: "text" as const, text: r.stderr.trim() || `kb note exited ${r.code}` }],
          details: { code: r.code, stderr: r.stderr },
          isError: true,
        };
      }
      const path = r.stdout.trim();
      return {
        content: [{ type: "text" as const, text: `Filed note: ${path}` }],
        details: { path },
      };
    },
  });

  // ---- /kb slash command ----------------------------------------------------

  // Mirror the CLI for human-driven invocation in the TUI. Routes args directly
  // to `kb` and shows output via ctx.ui.notify when small, otherwise as a
  // visible custom message so it lands in the conversation.
  const KB_SUBCOMMANDS = ["index", "search", "show", "list", "backlinks", "tags", "note", "path", "help"];

  pi.registerCommand("kb", {
    description: "Query the Unity KB (kb index | search <q> | show <slug>[#section] | list [type] | backlinks <slug>)",
    getArgumentCompletions: (prefix: string) => {
      // Only complete the first token (subcommand). Beyond that, bail to none.
      const trimmed = prefix.trimStart();
      if (trimmed.includes(" ")) return null;
      const items = KB_SUBCOMMANDS.filter((s) => s.startsWith(trimmed)).map((s) => ({
        value: s,
        label: s,
      }));
      return items.length > 0 ? items : null;
    },
    handler: async (args, ctx) => {
      const argv = (args ?? "").trim();
      const parts = argv.length > 0 ? argv.split(/\s+/) : ["help"];
      const result = await kb(parts);
      const out = result.code === 0 ? result.stdout : result.stderr || `kb exited ${result.code}`;
      const text = out.trim() || "(no output)";
      // Push into the conversation as a visible custom message so the agent
      // (and the user) can see it on screen and refer back to it.
      pi.sendMessage({
        customType: "unity-kb-output",
        content: text,
        display: true,
        details: { argv, code: result.code },
      });
      if (result.code !== 0) {
        ctx.ui.notify(`kb ${parts[0]} failed`, "error");
      }
    },
  });
}
