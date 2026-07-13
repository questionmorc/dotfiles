/**
 * personas - launch and switch named skill profiles.
 *
 * A "persona" is a named set of skills (plus optional model, thinking level, and
 * appended system prompt). pi is launched with `--no-skills`, so this extension is
 * the single source of truth for which skills exist in a session. It feeds the
 * active personas' skill directories back to pi via the `resources_discover` event.
 *
 * Launch:   pi --no-skills --persona unity-backend
 *           pi --no-skills --persona base,observability      (union of both)
 *           pi --no-skills                                    (loads defaultPersona)
 *
 * In session:
 *           /persona                 show active + available
 *           /persona list            list all personas with descriptions
 *           /persona set a,b         replace the active set
 *           /persona add name        add a persona (union)
 *           /persona remove name     drop a persona
 *           /persona reset           back to the default persona
 *
 * Config: ~/.pi/agent/personas.json (global) merged with <cwd>/.pi/personas.json (project).
 *
 * Why --no-skills is required: with it, pi loads ONLY the skill paths this extension
 * contributes, so a lean persona actually removes unneeded skills. Without it, pi's
 * ambient skills still load and personas can only add on top.
 */

import type { AutocompleteItem } from "@earendil-works/pi-tui";
import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonaDef {
	description?: string;
	extends?: string[];
	skills?: string[];
	/** Skill names, globs, or skill-directory/root paths to drop from the `*` wildcard. */
	exclude?: string[];
	model?: string;
	thinking?: string;
	appendSystemPrompt?: string;
}

interface PersonasConfig {
	defaultPersona?: string;
	skillRoots?: string[];
	personas?: Record<string, PersonaDef>;
}

interface Activation {
	names: string[];
	skillDirs: string[];
	usedAll: boolean;
	missing: string[];
	model?: string;
	thinking?: string;
	prompt: string;
}

const STATE_TYPE = "personas:state";
const BASELINE_TYPE = "personas:baseline";
const DEFAULT_ROOTS = [
	"~/.pi/agent/skills",
	"~/.local/share/superpowers/skills",
	"~/.local/share/caveman/skills",
	"~/.pi/agent/npm/node_modules/*/skills",
];

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** Match a value against a glob token containing `*` wildcards, without RegExp (ReDoS-safe). */
function globMatch(pattern: string, value: string): boolean {
	const parts = pattern.split("*");
	if (parts.length === 1) return pattern === value;
	let idx = 0;
	if (parts[0]) {
		if (!value.startsWith(parts[0])) return false;
		idx = parts[0].length;
	}
	for (let i = 1; i < parts.length - 1; i++) {
		const seg = parts[i];
		if (seg === "") continue;
		const found = value.indexOf(seg, idx);
		if (found === -1) return false;
		idx = found + seg.length;
	}
	const last = parts.at(-1) ?? "";
	if (last) {
		if (!value.endsWith(last)) return false;
		if (value.length - last.length < idx) return false;
	}
	return true;
}

function expandPath(p: string): string {
	let out = p.trim();
	if (out === "~") out = homedir();
	else if (out.startsWith("~/")) out = join(homedir(), out.slice(2));
	return out;
}

/** Expand a root that may contain `*` segments (one or more) into existing dirs. */
function expandGlobRoot(rootRaw: string): string[] {
	const root = expandPath(rootRaw);
	if (!root.includes("*")) return existsSync(root) ? [root] : [];
	const segments = root.split("/");
	let candidates = [segments[0] === "" ? "/" : segments[0]];
	for (let i = 1; i < segments.length; i++) {
		const seg = segments[i];
		const next: string[] = [];
		for (const base of candidates) {
			if (seg.includes("*")) {
				let entries: string[] = [];
				try {
					entries = readdirSync(base);
				} catch {
					entries = [];
				}
				for (const e of entries) {
					if (globMatch(seg, e)) next.push(join(base, e));
				}
			} else {
				next.push(join(base, seg));
			}
		}
		candidates = next;
	}
	return candidates.filter((c) => existsSync(c));
}

function safeReal(p: string): string {
	try {
		return realpathSync(p);
	} catch {
		return resolve(p);
	}
}

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

function agentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

function readJson(path: string): PersonasConfig | undefined {
	try {
		if (!existsSync(path)) return undefined;
		return JSON.parse(readFileSync(path, "utf8")) as PersonasConfig;
	} catch (err) {
		console.error(
			`[personas] failed to parse ${path}: ${(err as Error).message}`,
		);
		return undefined;
	}
}

function loadConfig(cwd: string): PersonasConfig {
	const global = readJson(join(agentDir(), "personas.json")) ?? {};
	const project = readJson(join(cwd, ".pi", "personas.json"));
	if (!project) return global;
	return {
		defaultPersona: project.defaultPersona ?? global.defaultPersona,
		skillRoots: project.skillRoots ?? global.skillRoots,
		personas: { ...(global.personas ?? {}), ...(project.personas ?? {}) },
	};
}

// ---------------------------------------------------------------------------
// Skill discovery: build name -> directory index across all roots
// ---------------------------------------------------------------------------

interface SkillIndex {
	byName: Map<string, string>; // skill name (dir basename or frontmatter name) -> dir
	roots: string[]; // existing, deduped roots
	allDirs: string[]; // every discovered skill dir, unique by realpath (for "*")
	namesByDir: Map<string, string[]>; // realpath(dir) -> [basename, frontmatter name]
}

function frontmatterName(skillMd: string): string | undefined {
	try {
		const text = readFileSync(skillMd, "utf8");
		const m = text.match(/^---\s*[\r\n]([\s\S]*?)[\r\n]---/);
		if (!m) return undefined;
		const line = m[1].split(/\r?\n/).find((l) => /^name\s*:/.test(l));
		if (!line) return undefined;
		return line
			.replace(/^name\s*:/, "")
			.trim()
			.replace(/^["']|["']$/g, "");
	} catch {
		return undefined;
	}
}

/** Recursively collect directories that directly contain a SKILL.md (depth-capped). */
function collectSkillDirs(root: string, depth: number, out: string[]): void {
	if (depth < 0) return;
	let entries: string[];
	try {
		entries = readdirSync(root);
	} catch {
		return;
	}
	if (entries.includes("SKILL.md")) {
		out.push(root);
		// A skill dir can still nest sub-skills; keep walking children.
	}
	for (const e of entries) {
		if (e.startsWith(".") || e === "node_modules") continue;
		const full = join(root, e);
		let st: ReturnType<typeof statSync>;
		try {
			st = statSync(full);
		} catch {
			continue;
		}
		if (st.isDirectory()) collectSkillDirs(full, depth - 1, out);
	}
}

function buildIndex(rootsRaw: string[]): SkillIndex {
	const byName = new Map<string, string>();
	const roots: string[] = [];
	const allDirs: string[] = [];
	const namesByDir = new Map<string, string[]>();
	const seenRoots = new Set<string>();
	const seenDirs = new Set<string>();
	for (const raw of rootsRaw) {
		for (const root of expandGlobRoot(raw)) {
			const real = safeReal(root);
			if (seenRoots.has(real)) continue;
			seenRoots.add(real);
			roots.push(root);
			const dirs: string[] = [];
			collectSkillDirs(root, 4, dirs);
			for (const dir of dirs) {
				const realDir = safeReal(dir);
				const dirName = basename(dir);
				const fmName = frontmatterName(join(dir, "SKILL.md"));
				if (!byName.has(dirName)) byName.set(dirName, dir);
				if (fmName && !byName.has(fmName)) byName.set(fmName, dir);
				if (!seenDirs.has(realDir)) {
					seenDirs.add(realDir);
					allDirs.push(dir);
					namesByDir.set(realDir, fmName ? [dirName, fmName] : [dirName]);
				}
			}
		}
	}
	return { byName, roots, allDirs, namesByDir };
}

/** Resolve a single skill token (not "*") to concrete skill directories/files. */
function resolveToken(
	token: string,
	index: SkillIndex,
): { dirs: string[]; missing: boolean } {
	if (token.includes("/") || token.startsWith("~") || token.startsWith(".")) {
		const p = expandPath(token);
		const abs = isAbsolute(p) ? p : resolve(p);
		if (!existsSync(abs)) return { dirs: [], missing: true };
		let st: ReturnType<typeof statSync>;
		try {
			st = statSync(abs);
		} catch {
			return { dirs: [], missing: true };
		}
		if (st.isDirectory()) {
			// A single skill dir (has SKILL.md), otherwise a root/dir of skills.
			if (existsSync(join(abs, "SKILL.md")))
				return { dirs: [abs], missing: false };
			const sub: string[] = [];
			collectSkillDirs(abs, 4, sub);
			return { dirs: sub, missing: sub.length === 0 };
		}
		return { dirs: [abs], missing: false }; // single-file .md skill
	}
	if (token.includes("*")) {
		const matched: string[] = [];
		for (const [name, dir] of index.byName)
			if (globMatch(token, name)) matched.push(dir);
		return { dirs: matched, missing: matched.length === 0 };
	}
	const dir = index.byName.get(token);
	return dir ? { dirs: [dir], missing: false } : { dirs: [], missing: true };
}

/** Build a predicate that tests whether a skill dir matches any exclude entry. */
function buildExcluder(
	entries: string[],
	index: SkillIndex,
): (dir: string) => boolean {
	const roots: string[] = [];
	const nameTokens: string[] = [];
	for (const ex of entries) {
		if (ex.includes("/") || ex.startsWith("~") || ex.startsWith(".")) {
			const p = expandPath(ex);
			const abs = isAbsolute(p) ? p : resolve(p);
			if (existsSync(abs)) roots.push(safeReal(abs));
		} else {
			nameTokens.push(ex);
		}
	}
	return (dir: string): boolean => {
		const real = safeReal(dir);
		for (const r of roots)
			if (real === r || real.startsWith(`${r}/`)) return true;
		const names = index.namesByDir.get(real) ?? [basename(dir)];
		for (const t of nameTokens) {
			for (const n of names) {
				if (t.includes("*") ? globMatch(t, n) : t === n) return true;
			}
		}
		return false;
	};
}

// ---------------------------------------------------------------------------
// Persona resolution
// ---------------------------------------------------------------------------

/** Recursively expand `extends`, returning skill tokens in order and merged model/thinking/prompt. */
function flattenPersonas(
	names: string[],
	config: PersonasConfig,
): {
	tokens: string[];
	excludes: string[];
	model?: string;
	thinking?: string;
	prompts: string[];
	missing: string[];
} {
	const personas = config.personas ?? {};
	const tokens: string[] = [];
	const excludes: string[] = [];
	const prompts: string[] = [];
	const missing: string[] = [];
	let model: string | undefined;
	let thinking: string | undefined;
	const visited = new Set<string>();

	const visit = (name: string) => {
		if (visited.has(name)) return;
		visited.add(name);
		const def = personas[name];
		if (!def) {
			missing.push(name);
			return;
		}
		for (const parent of def.extends ?? []) visit(parent);
		for (const s of def.skills ?? []) tokens.push(s);
		for (const e of def.exclude ?? []) excludes.push(e);
		if (def.model) model = def.model; // last-writer wins
		if (def.thinking) thinking = def.thinking;
		if (def.appendSystemPrompt) prompts.push(def.appendSystemPrompt.trim());
	};

	for (const name of names) visit(name);
	return { tokens, excludes, model, thinking, prompts, missing };
}

function resolveActivation(
	names: string[],
	config: PersonasConfig,
	index: SkillIndex,
): Activation {
	const { tokens, excludes, model, thinking, prompts, missing } =
		flattenPersonas(names, config);
	const missingSkills: string[] = [];
	let usedAll = false;

	// Explicitly listed skills are always included, even if another active persona
	// excludes them. Exclusions only trim the "*" wildcard expansion.
	const explicitDirs: string[] = [];
	const explicitReal = new Set<string>();
	for (const token of tokens) {
		if (token === "*") {
			usedAll = true;
			continue;
		}
		const { dirs, missing: miss } = resolveToken(token, index);
		if (miss) missingSkills.push(token);
		for (const d of dirs) {
			const real = safeReal(d);
			if (!explicitReal.has(real)) {
				explicitReal.add(real);
				explicitDirs.push(d);
			}
		}
	}

	const isExcluded = buildExcluder(excludes, index);
	const skillDirs: string[] = [];
	const seen = new Set<string>();
	const add = (dir: string) => {
		const real = safeReal(dir);
		if (!seen.has(real)) {
			seen.add(real);
			skillDirs.push(dir);
		}
	};
	for (const d of explicitDirs) add(d);
	if (usedAll) {
		for (const d of index.allDirs) {
			if (!isExcluded(d)) add(d);
		}
	}

	return {
		names,
		skillDirs,
		usedAll,
		missing: [...new Set([...missing, ...missingSkills])],
		model,
		thinking,
		prompt: prompts.filter(Boolean).join("\n\n"),
	};
}

// ---------------------------------------------------------------------------
// Active-set persistence (survives /reload and /resume via session entries)
// ---------------------------------------------------------------------------

function readLatestCustom<T>(
	ctx: ExtensionContext,
	type: string,
): T | undefined {
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

function parseNames(raw: string | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	pi.registerFlag?.("persona", {
		description:
			"Comma-separated persona(s) to activate at launch (see ~/.pi/agent/personas.json)",
		type: "string",
	});

	// Per-session cache. Cleared on shutdown so /reload recomputes cleanly.
	let cache: { activation: Activation; config: PersonasConfig } | null = null;

	function computeActive(ctx: ExtensionContext): {
		activation: Activation;
		config: PersonasConfig;
	} {
		if (cache) return cache;
		const config = loadConfig(ctx.cwd);
		const index = buildIndex(config.skillRoots ?? DEFAULT_ROOTS);

		// Priority: persisted state (set by /persona or a previous startup) > --persona flag > default.
		const persisted = readLatestCustom<{ active: string[] }>(ctx, STATE_TYPE);
		let names = persisted?.active ?? [];
		if (names.length === 0) {
			const flag =
				typeof pi.getFlag === "function"
					? (pi.getFlag("persona") as string | undefined)
					: undefined;
			names = parseNames(flag);
		}
		if (names.length === 0 && config.defaultPersona)
			names = [config.defaultPersona];

		// Drop unknown names up front so the status line stays honest, but remember them
		// so session_start can warn about a bad --persona value.
		const known = new Set(Object.keys(config.personas ?? {}));
		const unknownRequested = names.filter((n) => !known.has(n));
		names = names.filter((n) => known.has(n));
		if (
			names.length === 0 &&
			config.defaultPersona &&
			known.has(config.defaultPersona)
		) {
			names = [config.defaultPersona];
		}

		const activation = resolveActivation(names, config, index);
		activation.missing = [
			...new Set([...unknownRequested, ...activation.missing]),
		];
		cache = { activation, config };
		return cache;
	}

	function captureBaseline(ctx: ExtensionContext) {
		if (readLatestCustom(ctx, BASELINE_TYPE)) return;
		const model = ctx.model
			? { provider: ctx.model.provider, id: ctx.model.id }
			: undefined;
		let thinking: string | undefined;
		try {
			thinking = pi.getThinkingLevel?.();
		} catch {
			thinking = undefined;
		}
		pi.appendEntry(BASELINE_TYPE, { model, thinking });
	}

	async function applyModelAndThinking(
		ctx: ExtensionContext,
		activation: Activation,
	) {
		const baseline = readLatestCustom<{
			model?: { provider: string; id: string };
			thinking?: string;
		}>(ctx, BASELINE_TYPE);

		// Model: persona override, else restore baseline.
		// Guard: only apply model changes in interactive sessions (ctx.hasUI).
		// Non-interactive processes (subagents, print mode) have their model
		// set via --model CLI flag. Calling pi.setModel() here would persist
		// the change to settings.json, corrupting the user's default.
		const wantModel = activation.model;
		if (ctx.hasUI && wantModel) {
			const [provider, ...rest] = wantModel.includes("/")
				? wantModel.split("/")
				: [undefined, wantModel];
			const id = rest.join("/");
			const model = provider
				? ctx.modelRegistry?.find(provider, id)
				: undefined;
			if (model) {
				const ok = await pi.setModel(model);
				if (!ok)
					ctx.ui.notify(`persona: no API key for ${wantModel}`, "warn");
			} else {
				ctx.ui.notify(
					`persona: model "${wantModel}" not found (use "provider/id")`,
					"warn",
				);
			}
		} else if (ctx.hasUI && baseline?.model) {
			const model = ctx.modelRegistry?.find(
				baseline.model.provider,
				baseline.model.id,
			);
			if (model) await pi.setModel(model);
		}

		// Thinking: persona override, else restore baseline.
		const wantThinking = activation.thinking ?? baseline?.thinking;
		if (wantThinking) {
			try {
				pi.setThinkingLevel?.(wantThinking as never);
			} catch {
				/* clamped by model, ignore */
			}
		}
	}

	function renderStatus(ctx: ExtensionContext, activation: Activation) {
		if (!ctx.hasUI) return;
		const label = activation.names.length
			? activation.names.join(", ")
			: "(none)";
		ctx.ui.setStatus(
			"personas",
			`persona: ${label} [${activation.skillDirs.length} skills]`,
		);
	}

	// Contribute the active personas' skill dirs. Fires on startup and every /reload.
	pi.on("resources_discover", async (_event, ctx) => {
		const { activation } = computeActive(ctx);
		return { skillPaths: activation.skillDirs };
	});

	pi.on("session_start", async (_event, ctx) => {
		cache = null; // fresh generation
		captureBaseline(ctx);
		const { activation, config } = computeActive(ctx);

		// Persist the resolved set so /reload and /resume are deterministic.
		const persisted = readLatestCustom<{ active: string[] }>(ctx, STATE_TYPE);
		if (
			!persisted ||
			persisted.active.join(",") !== activation.names.join(",")
		) {
			pi.appendEntry(STATE_TYPE, { active: activation.names });
		}

		await applyModelAndThinking(ctx, activation);
		renderStatus(ctx, activation);

		if (process.env.PERSONAS_DEBUG) {
			console.error(
				`[personas] active=[${activation.names.join(",")}] usedAll=${activation.usedAll} ` +
					`skillDirs=${activation.skillDirs.length} missing=[${activation.missing.join(",")}] ` +
					`model=${activation.model ?? "-"} thinking=${activation.thinking ?? "-"}`,
			);
			for (const d of activation.skillDirs) console.error(`[personas]   ${d}`);
		}

		if (ctx.hasUI) {
			const label = activation.names.length
				? activation.names.join(", ")
				: (config.defaultPersona ?? "(none)");
			ctx.ui.notify(`persona: ${label}`, "info");
			if (activation.missing.length) {
				ctx.ui.notify(
					`persona: unknown ${activation.missing.join(", ")}`,
					"warn",
				);
			}
		}
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		const activation = cache?.activation;
		if (!activation?.prompt) return;
		return { systemPrompt: `${event.systemPrompt}\n\n${activation.prompt}` };
	});

	pi.on("session_shutdown", async () => {
		cache = null;
	});

	// -------------------------------------------------------------------------
	// /persona command
	// -------------------------------------------------------------------------

	function listText(config: PersonasConfig, active: string[]): string {
		const lines: string[] = [];
		for (const [name, def] of Object.entries(config.personas ?? {})) {
			const mark = active.includes(name) ? "*" : " ";
			lines.push(`${mark} ${name}  ${def.description ?? ""}`.trimEnd());
		}
		return lines.join("\n");
	}

	async function reloadWith(ctx: ExtensionCommandContext, names: string[]) {
		const config = loadConfig(ctx.cwd);
		const known = new Set(Object.keys(config.personas ?? {}));
		const unknown = names.filter((n) => !known.has(n));
		if (unknown.length) {
			ctx.ui.notify(`persona: unknown ${unknown.join(", ")}`, "error");
			return;
		}
		const deduped = [...new Set(names)];
		pi.appendEntry(STATE_TYPE, { active: deduped });
		cache = null;
		ctx.ui.notify(
			`persona: switching to ${deduped.join(", ") || "(none)"}`,
			"info",
		);
		await ctx.reload();
	}

	pi.registerCommand("persona", {
		description: "Show, switch, or combine skill personas",
		getArgumentCompletions: (prefix: string): AutocompleteItem[] | null => {
			const config = loadConfig(process.cwd());
			const parts = prefix.split(/\s+/);
			const sub = parts[0] ?? "";
			const subs = ["list", "set", "add", "remove", "reset", "show"];
			// First token: suggest subcommands.
			if (parts.length <= 1 && !subs.includes(sub)) {
				const items = subs.map((s) => ({ value: s, label: s }));
				const f = items.filter((i) => i.value.startsWith(sub));
				return f.length ? f : items;
			}
			// Later tokens: suggest persona names.
			const last = parts.at(-1) ?? "";
			const names = Object.keys(config.personas ?? {});
			const items = names.map((n) => ({
				value: n,
				label: n,
				description: config.personas?.[n]?.description,
			}));
			const f = items.filter((i) => i.value.startsWith(last));
			return f.length ? f : items;
		},
		handler: async (args: string, ctx: ExtensionCommandContext) => {
			const config = loadConfig(ctx.cwd);
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const sub = (parts[0] ?? "").toLowerCase();
			const rest = parts.slice(1).join(" ");
			const restNames = parseNames(rest.replace(/\s+/g, ","));
			const active =
				readLatestCustom<{ active: string[] }>(ctx, STATE_TYPE)?.active ?? [];

			switch (sub) {
				case "":
				case "show": {
					const label = active.length ? active.join(", ") : "(none)";
					ctx.ui.notify(
						`Active: ${label}\n\n${listText(config, active)}`,
						"info",
					);
					return;
				}
				case "list": {
					ctx.ui.notify(listText(config, active), "info");
					return;
				}
				case "set": {
					if (!restNames.length) {
						ctx.ui.notify("usage: /persona set <name>[,<name>...]", "error");
						return;
					}
					await reloadWith(ctx, restNames);
					return;
				}
				case "add": {
					if (!restNames.length) {
						ctx.ui.notify("usage: /persona add <name>", "error");
						return;
					}
					await reloadWith(ctx, [...active, ...restNames]);
					return;
				}
				case "remove":
				case "rm": {
					if (!restNames.length) {
						ctx.ui.notify("usage: /persona remove <name>", "error");
						return;
					}
					await reloadWith(
						ctx,
						active.filter((n) => !restNames.includes(n)),
					);
					return;
				}
				case "reset": {
					await reloadWith(
						ctx,
						config.defaultPersona ? [config.defaultPersona] : [],
					);
					return;
				}
				default: {
					// Bare names: treat "/persona a,b" as "set a,b".
					await reloadWith(ctx, parseNames(args.replace(/\s+/g, ",")));
					return;
				}
			}
		},
	});
}
