import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** personas.json files consulted for validation: global agent dir, then project. */
export function personaConfigPaths(cwd: string): string[] {
	const agentDir =
		process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
	return [join(agentDir, "personas.json"), join(cwd, ".pi", "personas.json")];
}

/** Persona names declared across the given config files, in first-seen order. */
export function knownPersonaNames(paths: string[]): string[] {
	const names: string[] = [];
	const seen = new Set<string>();
	for (const path of paths) {
		let config: { personas?: Record<string, unknown> };
		try {
			config = JSON.parse(readFileSync(path, "utf8"));
		} catch {
			continue;
		}
		for (const name of Object.keys(config.personas ?? {})) {
			if (seen.has(name)) continue;
			seen.add(name);
			names.push(name);
		}
	}
	return names;
}

/** Parse a comma-separated persona argument and flag names no config declares. */
export function resolvePersonaArg(
	raw: string | undefined,
	known: string[],
): { names: string[]; unknown: string[] } {
	const names = [
		...new Set(
			(raw ?? "")
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
		),
	];
	if (known.length === 0) return { names, unknown: [] };
	return { names, unknown: names.filter((n) => !known.includes(n)) };
}
