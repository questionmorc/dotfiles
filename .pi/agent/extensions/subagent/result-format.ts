/**
 * Shaping of subagent output into the text the parent model actually receives.
 *
 * The parent only ever sees a tool result's `content`; `details` is renderer-only
 * and is never serialized to a provider. Anything dropped here is dropped for good,
 * so parallel mode returns real output under a byte budget and spills the rest to
 * disk instead of previewing it away.
 *
 * Kept free of pi imports so it can be unit tested on its own.
 */

export const PARALLEL_BUDGET_BYTES = 50 * 1024;

export const OUTPUT_CAP_WARNING =
	"[warning: the subagent hit its output token limit, so this response is cut off mid-answer and is incomplete. Nothing more was generated; re-run with a narrower task to get the rest.]";

interface TextPartLike {
	type: string;
	text?: unknown;
}

interface MessageLike {
	role: string;
	content?: unknown;
}

/** Concatenates every text part of the last assistant message that produced any text. */
export function collectFinalText(messages: readonly MessageLike[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (message.role !== "assistant" || !Array.isArray(message.content)) continue;
		const texts = (message.content as TextPartLike[])
			.filter((part) => part.type === "text" && typeof part.text === "string")
			.map((part) => part.text as string);
		if (texts.length > 0) return texts.join("\n");
	}
	return "";
}

/** Appends a truncation warning when the model stopped on its output token ceiling. */
export function withCapWarning(text: string, outputCapped: boolean): string {
	if (!outputCapped) return text;
	return text ? `${text}\n\n${OUTPUT_CAP_WARNING}` : OUTPUT_CAP_WARNING;
}

/**
 * Max-min fair share: every task gets an equal slice, and whatever a task does not
 * need is redistributed among the tasks that are still over their slice. A verbose
 * task can therefore never starve a terse one.
 */
export function allocateBudget(sizes: readonly number[], budget: number): number[] {
	const allocation = new Array<number>(sizes.length).fill(0);
	let remaining = budget;
	let pending = sizes.map((_, index) => index);

	while (pending.length > 0) {
		const share = Math.floor(remaining / pending.length);
		if (share <= 0) break;
		const fitting = pending.filter((index) => sizes[index] <= share);
		if (fitting.length === 0) {
			for (const index of pending) allocation[index] = share;
			break;
		}
		for (const index of fitting) {
			allocation[index] = sizes[index];
			remaining -= sizes[index];
		}
		pending = pending.filter((index) => sizes[index] > share);
	}
	return allocation;
}

/** Cuts text to a byte budget on the last line boundary, never splitting a character. */
export function clipToBytes(text: string, maxBytes: number): { text: string; clipped: boolean } {
	const buffer = Buffer.from(text, "utf-8");
	if (buffer.length <= maxBytes) return { text, clipped: false };
	if (maxBytes <= 0) return { text: "", clipped: true };

	let end = maxBytes;
	while (end > 0 && (buffer[end] & 0xc0) === 0x80) end--;
	const head = buffer.subarray(0, end).toString("utf-8");
	const lastNewline = head.lastIndexOf("\n");
	return { text: lastNewline > 0 ? head.slice(0, lastNewline) : head, clipped: true };
}

export interface ParallelEntry {
	agent: string;
	output: string;
	failureReason: string | undefined;
	outputCapped: boolean;
}

export interface ParallelFormatOptions {
	budget: number;
	/** Persists a full body somewhere the parent can read it; returns the path, or undefined if it could not. */
	spill: (agent: string, index: number, body: string) => string | undefined;
}

function formatBytes(bytes: number): string {
	return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;
}

export function formatParallelContent(entries: readonly ParallelEntry[], options: ParallelFormatOptions): string {
	const bodies = entries.map((entry) => withCapWarning(entry.output, entry.outputCapped));
	const allocation = allocateBudget(
		bodies.map((body) => Buffer.byteLength(body, "utf-8")),
		options.budget,
	);
	const successCount = entries.filter((entry) => !entry.failureReason).length;

	const sections = entries.map((entry, index) => {
		const body = bodies[index];
		const status = entry.failureReason ? `failed (${entry.failureReason})` : "completed";
		const header = `─── [${index + 1}] ${entry.agent} ${status}`;
		if (!body) return `${header}\n(no output)`;

		const { text, clipped } = clipToBytes(body, allocation[index]);
		if (!clipped) return `${header}\n${text}`;

		const path = options.spill(entry.agent, index, body);
		const total = formatBytes(Buffer.byteLength(body, "utf-8"));
		const kept = formatBytes(Buffer.byteLength(text, "utf-8"));
		const note = path
			? `[clipped to ${kept} of ${total} by the parallel output budget; full output: \`${path}\`]`
			: `[clipped to ${kept} of ${total} by the parallel output budget; the rest could not be saved to disk]`;
		return `${header}\n${text}\n${note}`;
	});

	return `Parallel: ${successCount}/${entries.length} succeeded\n\n${sections.join("\n\n")}`;
}
