/**
 * Path expansion and `@file` prompt sources for persona definitions.
 *
 * A persona's `appendSystemPrompt` is either literal text or `@<path>`, where the
 * path points at a markdown file whose body (frontmatter stripped) becomes the
 * appended prompt.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

export interface ResolvedPrompt {
	text: string;
	error?: string;
}

export interface PromptSourceOptions {
	/** Directory that relative `@paths` resolve against. Defaults to `process.cwd()`. */
	baseDir?: string;
	readFile?: (path: string) => string;
}

export function expandPath(p: string): string {
	let out = p.trim();
	if (out === "~") out = homedir();
	else if (out.startsWith("~/")) out = join(homedir(), out.slice(2));
	return out;
}

export function resolvePromptValue(
	raw: string,
	options: PromptSourceOptions = {},
): ResolvedPrompt {
	const value = raw.trim();
	if (!value.startsWith("@")) return { text: value };

	const spec = value.slice(1).trim();
	if (!spec) return { text: "", error: "appendSystemPrompt: empty @path" };

	const expanded = expandPath(spec);
	const path = isAbsolute(expanded)
		? expanded
		: resolve(options.baseDir ?? process.cwd(), expanded);
	const readFile = options.readFile ?? ((p: string) => readFileSync(p, "utf8"));

	try {
		return { text: stripFrontmatter(readFile(path)) };
	} catch {
		return { text: "", error: `appendSystemPrompt: cannot read ${path}` };
	}
}

function stripFrontmatter(content: string): string {
	const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
	return (match ? match[1] : content).trim();
}
