/**
 * Launch-flag parsing.
 *
 * The factory runs before pi has surfaced parsed flags, so the active toolset is
 * read straight from argv.
 */

const FLAG = "--toolset";

export function flagFromArgv(argv: readonly string[]): string | undefined {
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--") return undefined;
		if (arg === FLAG) return argv[i + 1];
		if (arg.startsWith(`${FLAG}=`)) return arg.slice(FLAG.length + 1);
	}
	return undefined;
}
