/**
 * Vim Mode - a fuller modal editor for the pi TUI input box.
 *
 * Extends the bundled `modal-editor.ts` example with a real operator + motion
 * engine instead of replaying escape sequences. Operates directly on the
 * editor's text model (getText / cursor / undo stack), so counts, word objects,
 * operators and registers behave like vim.
 *
 * Insert + normal mode only (no visual mode). For block / visual selection,
 * open the buffer in $EDITOR with ctrl+g.
 *
 * Install: this lives in ~/.pi/agent/extensions/vim-mode/ and auto-loads.
 * Run `/reload` after editing. Remove the symlink to disable.
 *
 * Modes
 *   Escape   insert -> normal (in normal mode, aborts the agent)
 *   i a A I  enter insert (in place / append / append-EOL / first non-blank)
 *   o O      open line below / above and insert
 *
 * Motions (also usable after an operator)
 *   h j k l            left / down / up / right
 *   w W b B e E        word / WORD forward-start, back, forward-end
 *   0 ^ $              line start / first non-blank / line end
 *   gg G               buffer start / buffer end
 *   f{c} F{c} t{c} T{c}  find char on line (inclusive / till)
 *   ; ,                repeat / reverse last f F t T
 *
 * Operators
 *   d c y + motion     delete / change / yank over motion (e.g. dw, c$, y2e)
 *   dd cc yy           whole-line variants (counts: 3dd)
 *   D C Y              to end of line
 *   x X                delete char under / before cursor (counts)
 *   s S                substitute char / line
 *   r{c}               replace char under cursor
 *   ~                  toggle case of char under cursor
 *   J                  join line below
 *   p P                paste register after / before (charwise or linewise)
 *   u                  undo
 *
 * Notes / limitations
 *   - Single unnamed register only (no named registers, no `.` repeat, no redo).
 */

import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

type Mode = "insert" | "normal";
type Operator = "d" | "c" | "y";
type FindKind = "f" | "F" | "t" | "T";

interface EditorState {
	lines: string[];
	cursorLine: number;
	cursorCol: number;
}

interface Pos {
	line: number;
	col: number;
}

interface Motion {
	line: number;
	col: number;
	inclusive: boolean;
	linewise: boolean;
}

interface Register {
	text: string;
	linewise: boolean;
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(n, hi));

// --- pure helpers operating on a flat string -------------------------------

const flatten = (lines: string[]): string => lines.join("\n");

const toOffset = (lines: string[], line: number, col: number): number => {
	let off = 0;
	for (let i = 0; i < line; i++) off += (lines[i]?.length ?? 0) + 1;
	return off + col;
};

const toPos = (lines: string[], off: number): Pos => {
	let i = 0;
	let rem = Math.max(0, off);
	while (i < lines.length - 1 && rem > (lines[i]?.length ?? 0)) {
		rem -= (lines[i]?.length ?? 0) + 1;
		i++;
	}
	const len = lines[i]?.length ?? 0;
	return { line: i, col: clamp(rem, 0, len) };
};

type CharClass = "ws" | "word" | "punct";

const classOf = (ch: string | undefined, big: boolean): CharClass => {
	if (ch === undefined || /\s/.test(ch)) return "ws";
	if (big) return "word";
	return /\w/.test(ch) ? "word" : "punct";
};

const wordForward = (s: string, i: number, big: boolean): number => {
	const n = s.length;
	if (i >= n) return n;
	const c0 = classOf(s[i], big);
	if (c0 !== "ws") {
		while (i < n && classOf(s[i], big) === c0) i++;
	}
	while (i < n && classOf(s[i], big) === "ws") i++;
	return Math.min(i, n);
};

const wordEnd = (s: string, i: number, big: boolean): number => {
	const n = s.length;
	if (i >= n - 1) return Math.max(0, n - 1);
	i++;
	while (i < n && classOf(s[i], big) === "ws") i++;
	if (i >= n) return n - 1;
	const c0 = classOf(s[i], big);
	while (i + 1 < n && classOf(s[i + 1], big) === c0) i++;
	return i;
};

const wordBackward = (s: string, i: number, big: boolean): number => {
	if (i <= 0) return 0;
	i--;
	while (i > 0 && classOf(s[i], big) === "ws") i--;
	if (i <= 0) return 0;
	const c0 = classOf(s[i], big);
	while (i > 0 && classOf(s[i - 1], big) === c0) i--;
	return i;
};

const firstNonBlank = (line: string): number => {
	const m = line.match(/\S/);
	return m ? (m.index ?? 0) : 0;
};

const toggleCase = (ch: string): string =>
	ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();

// --- the editor ------------------------------------------------------------

class VimEditor extends CustomEditor {
	private mode: Mode = "insert";
	private op: Operator | null = null;
	private count = "";
	private opCount = "";
	private gPending = false;
	private findPending: { kind: FindKind; forOp: boolean } | null = null;
	private replacePending = false;
	private register: Register = { text: "", linewise: false };
	private lastFind: { kind: FindKind; char: string } | null = null;

	private get st(): EditorState {
		return (this as unknown as { state: EditorState }).state;
	}

	private pushUndo(): void {
		(this as unknown as { pushUndoSnapshot(): void }).pushUndoSnapshot();
	}

	private fireChange(): void {
		this.onChange?.(this.getText());
		(this as unknown as { tui: { requestRender(): void } }).tui.requestRender();
	}

	// Move cursor only (no text change, no undo).
	private moveTo(line: number, col: number, allowEnd = false): void {
		const st = this.st;
		st.cursorLine = clamp(line, 0, st.lines.length - 1);
		const len = st.lines[st.cursorLine]?.length ?? 0;
		const max = allowEnd ? len : Math.max(0, len - 1);
		st.cursorCol = clamp(col, 0, max);
		(this as unknown as { preferredVisualCol: number | null }).preferredVisualCol = null;
		(this as unknown as { tui: { requestRender(): void } }).tui.requestRender();
	}

	// Replace whole buffer + cursor (with undo snapshot).
	private commit(lines: string[], line: number, col: number, allowEnd = false): void {
		const st = this.st;
		this.pushUndo();
		st.lines = lines.length ? lines : [""];
		st.cursorLine = clamp(line, 0, st.lines.length - 1);
		const len = st.lines[st.cursorLine]?.length ?? 0;
		const max = allowEnd ? len : Math.max(0, len - 1);
		st.cursorCol = clamp(col, 0, max);
		(this as unknown as { preferredVisualCol: number | null }).preferredVisualCol = null;
		(this as unknown as { lastAction: unknown }).lastAction = null;
		this.fireChange();
	}

	private resetPending(): void {
		this.op = null;
		this.count = "";
		this.opCount = "";
		this.gPending = false;
		this.findPending = null;
		this.replacePending = false;
	}

	private effectiveCount(): number {
		const a = this.opCount ? parseInt(this.opCount, 10) : 1;
		const b = this.count ? parseInt(this.count, 10) : 1;
		return Math.max(1, a * b);
	}

	// ---- input dispatch ----

	handleInput(data: string): void {
		if (matchesKey(data, "escape")) {
			if (this.mode === "insert") {
				this.mode = "normal";
				this.moveTo(this.st.cursorLine, this.st.cursorCol - 1);
			} else {
				super.handleInput(data); // abort agent
			}
			this.resetPending();
			(this as unknown as { tui: { requestRender(): void } }).tui.requestRender();
			return;
		}

		if (this.mode === "insert") {
			super.handleInput(data);
			return;
		}

		// Pending single-char consumers (f/F/t/T/r) come first.
		if (this.findPending && data.length === 1 && data.charCodeAt(0) >= 32) {
			this.applyFind(this.findPending.kind, data, this.findPending.forOp);
			this.findPending = null;
			return;
		}
		if (this.replacePending) {
			if (data.length === 1 && data.charCodeAt(0) >= 32) this.applyReplace(data);
			this.replacePending = false;
			return;
		}

		this.handleNormal(data);
	}

	private handleNormal(data: string): void {
		// Pass useful control keys straight through to the app/base editor.
		if (
			matchesKey(data, "enter") ||
			matchesKey(data, "ctrl+c") ||
			matchesKey(data, "ctrl+d") ||
			matchesKey(data, "tab") ||
			(data.length > 1 && data.charCodeAt(0) === 27) // arrow keys, etc.
		) {
			super.handleInput(data);
			return;
		}

		// Only single printable chars are vim commands from here on.
		if (data.length !== 1) {
			super.handleInput(data);
			return;
		}

		// Count accumulation ('0' is a motion when count is empty).
		if (/[0-9]/.test(data) && !(data === "0" && this.count === "")) {
			this.count += data;
			(this as unknown as { tui: { requestRender(): void } }).tui.requestRender();
			return;
		}

		// 'g' prefix (gg).
		if (this.gPending) {
			this.gPending = false;
			if (data === "g") {
				this.execMotionOrOp("gg");
				return;
			}
			// fall through: treat as fresh key
		}
		if (data === "g") {
			this.gPending = true;
			return;
		}

		// Operator doubling: dd / cc / yy.
		if (this.op && data === this.op) {
			this.applyLinewiseOperator(this.op, this.effectiveCount());
			this.resetPending();
			return;
		}

		// Operators.
		if (data === "d" || data === "c" || data === "y") {
			this.op = data as Operator;
			this.opCount = this.count;
			this.count = "";
			return;
		}

		// Motions (movement or operator target).
		if (this.isMotionKey(data)) {
			this.execMotionOrOp(data);
			return;
		}

		// Standalone actions (only when no operator pending).
		if (!this.op) {
			this.execAction(data);
			return;
		}

		// Unknown key while operator pending: cancel.
		this.resetPending();
	}

	private isMotionKey(k: string): boolean {
		return "hjklwWbBeE0^$G".includes(k) || "fFtT;,".includes(k);
	}

	// ---- motion resolution ----

	private resolveMotion(key: string, count: number): Motion | null {
		const st = this.st;
		const { cursorLine: line, cursorCol: col } = st;
		const lines = st.lines;
		const s = flatten(lines);

		switch (key) {
			case "h":
				return { line, col: Math.max(0, col - count), inclusive: false, linewise: false };
			case "l": {
				const len = lines[line]?.length ?? 0;
				return { line, col: Math.min(len, col + count), inclusive: false, linewise: false };
			}
			case "j":
				return { line: line + count, col, inclusive: false, linewise: true };
			case "k":
				return { line: line - count, col, inclusive: false, linewise: true };
			case "0":
				return { line, col: 0, inclusive: false, linewise: false };
			case "^":
				return { line, col: firstNonBlank(lines[line] ?? ""), inclusive: false, linewise: false };
			case "$": {
				const len = lines[line]?.length ?? 0;
				return { line, col: Math.max(0, len), inclusive: true, linewise: false };
			}
			case "gg":
				return { line: 0, col: firstNonBlank(lines[0] ?? ""), inclusive: false, linewise: true };
			case "G": {
				const target = this.count || this.opCount ? count - 1 : lines.length - 1;
				return { line: target, col: firstNonBlank(lines[clamp(target, 0, lines.length - 1)] ?? ""), inclusive: false, linewise: true };
			}
			case "w":
			case "W": {
				let off = toOffset(lines, line, col);
				for (let i = 0; i < count; i++) off = wordForward(s, off, key === "W");
				const p = toPos(lines, off);
				return { ...p, inclusive: false, linewise: false };
			}
			case "b":
			case "B": {
				let off = toOffset(lines, line, col);
				for (let i = 0; i < count; i++) off = wordBackward(s, off, key === "B");
				const p = toPos(lines, off);
				return { ...p, inclusive: false, linewise: false };
			}
			case "e":
			case "E": {
				let off = toOffset(lines, line, col);
				for (let i = 0; i < count; i++) off = wordEnd(s, off, key === "E");
				const p = toPos(lines, off);
				return { ...p, inclusive: true, linewise: false };
			}
			default:
				return null;
		}
	}

	private execMotionOrOp(key: string): void {
		// f/F/t/T need a follow-up char.
		if (key === "f" || key === "F" || key === "t" || key === "T") {
			this.findPending = { kind: key, forOp: this.op !== null };
			return;
		}
		if (key === ";" || key === ",") {
			this.repeatFind(key === ",");
			return;
		}

		const count = this.effectiveCount();

		// vim special case: `cw`/`cW` act like `ce`/`cE` when on a non-blank.
		let motionKey = key;
		if (this.op === "c" && (key === "w" || key === "W")) {
			const st = this.st;
			const ch = st.lines[st.cursorLine]?.[st.cursorCol];
			if (ch !== undefined && !/\s/.test(ch)) motionKey = key === "w" ? "e" : "E";
		}

		const m = this.resolveMotion(motionKey, count);
		if (!m) {
			this.resetPending();
			return;
		}

		if (this.op) {
			this.applyOperatorMotion(this.op, m);
			this.resetPending();
		} else {
			this.moveTo(m.line, m.col);
			this.count = "";
		}
	}

	// ---- find char (f F t T ; ,) ----

	private applyFind(kind: FindKind, char: string, forOp: boolean): void {
		this.lastFind = { kind, char };
		const m = this.computeFind(kind, char);
		if (!m) {
			this.resetPending();
			return;
		}
		if (forOp && this.op) {
			this.applyOperatorMotion(this.op, m);
		} else {
			this.moveTo(m.line, m.col);
		}
		this.resetPending();
	}

	private repeatFind(reverse: boolean): void {
		if (!this.lastFind) {
			this.resetPending();
			return;
		}
		let { kind } = this.lastFind;
		if (reverse) {
			kind = ({ f: "F", F: "f", t: "T", T: "t" } as Record<FindKind, FindKind>)[kind];
		}
		this.applyFind(kind, this.lastFind.char, this.op !== null);
	}

	private computeFind(kind: FindKind, char: string): Motion | null {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		const col = st.cursorCol;
		const count = this.effectiveCount();
		if (kind === "f" || kind === "t") {
			let idx = col;
			let found = -1;
			let hits = 0;
			const start = kind === "t" ? col + 2 : col + 1;
			for (idx = start; idx < line.length; idx++) {
				if (line[idx] === char) {
					hits++;
					if (hits === count) {
						found = idx;
						break;
					}
				}
			}
			if (found < 0) return null;
			const target = kind === "t" ? found - 1 : found;
			return { line: st.cursorLine, col: target, inclusive: true, linewise: false };
		}
		// F / T (backward)
		let found = -1;
		let hits = 0;
		const start = kind === "T" ? col - 2 : col - 1;
		for (let idx = start; idx >= 0; idx--) {
			if (line[idx] === char) {
				hits++;
				if (hits === count) {
					found = idx;
					break;
				}
			}
		}
		if (found < 0) return null;
		const target = kind === "T" ? found + 1 : found;
		return { line: st.cursorLine, col: target, inclusive: false, linewise: false };
	}

	// ---- operators ----

	private applyOperatorMotion(op: Operator, m: Motion): void {
		const st = this.st;
		const from: Pos = { line: st.cursorLine, col: st.cursorCol };
		const to: Pos = { line: m.line, col: m.col };

		if (m.linewise) {
			const a = Math.min(from.line, to.line);
			const b = Math.max(from.line, to.line);
			this.operateLines(op, a, b);
			return;
		}

		// charwise: order positions
		let lo = from;
		let hi = to;
		const fo = toOffset(st.lines, from.line, from.col);
		const tooff = toOffset(st.lines, to.line, to.col);
		if (tooff < fo) {
			lo = to;
			hi = from;
		}
		let loOff = toOffset(st.lines, lo.line, lo.col);
		let hiOff = toOffset(st.lines, hi.line, hi.col);
		if (m.inclusive) hiOff += 1;
		// cw / ce special-case: change behaves like up-to-end-of-word (already inclusive e).
		this.operateRange(op, loOff, hiOff);
	}

	private operateRange(op: Operator, loOff: number, hiOff: number): void {
		const st = this.st;
		const s = flatten(st.lines);
		const lo = clamp(loOff, 0, s.length);
		const hi = clamp(hiOff, 0, s.length);
		if (hi <= lo && op !== "c") return;
		const cut = s.slice(lo, hi);

		if (op === "y") {
			this.register = { text: cut, linewise: false };
			const p = toPos(st.lines, lo);
			this.moveTo(p.line, p.col);
			this.resetPending();
			return;
		}

		this.register = { text: cut, linewise: false };
		const next = s.slice(0, lo) + s.slice(hi);
		const p = toPos(next.split("\n"), lo);
		this.commit(next.split("\n"), p.line, p.col, op === "c");
		if (op === "c") this.mode = "insert";
	}

	private operateLines(op: Operator, a: number, b: number): void {
		const st = this.st;
		const lines = st.lines;
		const lo = clamp(a, 0, lines.length - 1);
		const hi = clamp(b, 0, lines.length - 1);
		const slice = lines.slice(lo, hi + 1).join("\n");

		if (op === "y") {
			this.register = { text: slice + "\n", linewise: true };
			this.moveTo(lo, firstNonBlank(lines[lo] ?? ""));
			this.resetPending();
			return;
		}

		this.register = { text: slice + "\n", linewise: true };

		if (op === "c") {
			const next = [...lines.slice(0, lo), "", ...lines.slice(hi + 1)];
			this.commit(next, lo, 0, true);
			this.mode = "insert";
			return;
		}

		// delete whole lines
		const next = [...lines.slice(0, lo), ...lines.slice(hi + 1)];
		const targetLine = clamp(lo, 0, Math.max(0, next.length - 1));
		this.commit(next.length ? next : [""], targetLine, firstNonBlank((next[targetLine] ?? "")));
	}

	private applyLinewiseOperator(op: Operator, count: number): void {
		const st = this.st;
		const a = st.cursorLine;
		const b = Math.min(st.lines.length - 1, a + count - 1);
		this.operateLines(op, a, b);
	}

	// ---- standalone actions ----

	private execAction(data: string): void {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		const count = this.effectiveCount();

		switch (data) {
			case "i":
				this.mode = "insert";
				break;
			case "a":
				this.mode = "insert";
				this.moveTo(st.cursorLine, st.cursorCol + 1, true);
				break;
			case "A":
				this.mode = "insert";
				this.moveTo(st.cursorLine, line.length, true);
				break;
			case "I":
				this.mode = "insert";
				this.moveTo(st.cursorLine, firstNonBlank(line), true);
				break;
			case "o": {
				const next = [...st.lines.slice(0, st.cursorLine + 1), "", ...st.lines.slice(st.cursorLine + 1)];
				this.commit(next, st.cursorLine + 1, 0, true);
				this.mode = "insert";
				break;
			}
			case "O": {
				const next = [...st.lines.slice(0, st.cursorLine), "", ...st.lines.slice(st.cursorLine)];
				this.commit(next, st.cursorLine, 0, true);
				this.mode = "insert";
				break;
			}
			case "x":
				this.deleteChars(count, false);
				break;
			case "X":
				this.deleteChars(count, true);
				break;
			case "D":
				this.toEol("d");
				break;
			case "C":
				this.toEol("c");
				break;
			case "Y":
				this.applyLinewiseOperator("y", count);
				break;
			case "s":
				this.deleteChars(count, false);
				this.mode = "insert";
				break;
			case "S":
				this.applyLinewiseOperator("c", count);
				break;
			case "r":
				this.replacePending = true;
				break;
			case "~":
				this.toggleCaseUnderCursor(count);
				break;
			case "J":
				this.joinLines(count);
				break;
			case "p":
				this.paste(true);
				break;
			case "P":
				this.paste(false);
				break;
			case "u":
				(this as unknown as { undo(): void }).undo();
				(this as unknown as { tui: { requestRender(): void } }).tui.requestRender();
				break;
			default:
				break;
		}
		this.count = "";
		this.gPending = false;
	}

	private deleteChars(count: number, before: boolean): void {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		if (before) {
			const start = Math.max(0, st.cursorCol - count);
			const removed = line.slice(start, st.cursorCol);
			if (!removed) return;
			this.register = { text: removed, linewise: false };
			const next = [...st.lines];
			next[st.cursorLine] = line.slice(0, start) + line.slice(st.cursorCol);
			this.commit(next, st.cursorLine, start);
		} else {
			const end = Math.min(line.length, st.cursorCol + count);
			const removed = line.slice(st.cursorCol, end);
			if (!removed) return;
			this.register = { text: removed, linewise: false };
			const next = [...st.lines];
			next[st.cursorLine] = line.slice(0, st.cursorCol) + line.slice(end);
			this.commit(next, st.cursorLine, st.cursorCol);
		}
	}

	private toEol(op: "d" | "c"): void {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		this.register = { text: line.slice(st.cursorCol), linewise: false };
		const next = [...st.lines];
		next[st.cursorLine] = line.slice(0, st.cursorCol);
		this.commit(next, st.cursorLine, st.cursorCol, op === "c");
		if (op === "c") this.mode = "insert";
	}

	private applyReplace(ch: string): void {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		if (st.cursorCol >= line.length) return;
		const next = [...st.lines];
		next[st.cursorLine] = line.slice(0, st.cursorCol) + ch + line.slice(st.cursorCol + 1);
		this.commit(next, st.cursorLine, st.cursorCol);
	}

	private toggleCaseUnderCursor(count: number): void {
		const st = this.st;
		const line = st.lines[st.cursorLine] ?? "";
		const end = Math.min(line.length, st.cursorCol + count);
		if (st.cursorCol >= line.length) return;
		const changed = line.slice(st.cursorCol, end).split("").map(toggleCase).join("");
		const next = [...st.lines];
		next[st.cursorLine] = line.slice(0, st.cursorCol) + changed + line.slice(end);
		this.commit(next, st.cursorLine, Math.min(end, Math.max(0, line.length - 1)));
	}

	private joinLines(count: number): void {
		const st = this.st;
		const joins = Math.max(1, count - 1) || 1;
		const next = [...st.lines];
		let cursorCol = (next[st.cursorLine] ?? "").length;
		for (let i = 0; i < joins; i++) {
			if (st.cursorLine + 1 >= next.length) break;
			const cur = next[st.cursorLine] ?? "";
			const below = (next[st.cursorLine + 1] ?? "").replace(/^\s+/, "");
			const sep = cur.length && below.length ? " " : "";
			cursorCol = cur.length;
			next[st.cursorLine] = cur + sep + below;
			next.splice(st.cursorLine + 1, 1);
		}
		this.commit(next, st.cursorLine, cursorCol);
	}

	private paste(after: boolean): void {
		const st = this.st;
		if (!this.register.text) return;
		if (this.register.linewise) {
			const body = this.register.text.replace(/\n$/, "").split("\n");
			const at = after ? st.cursorLine + 1 : st.cursorLine;
			const next = [...st.lines.slice(0, at), ...body, ...st.lines.slice(at)];
			this.commit(next, at, firstNonBlank(body[0] ?? ""));
		} else {
			const line = st.lines[st.cursorLine] ?? "";
			const at = after ? Math.min(line.length, st.cursorCol + 1) : st.cursorCol;
			const inserted = this.register.text;
			if (inserted.includes("\n")) {
				const flat = flatten(st.lines);
				const off = toOffset(st.lines, st.cursorLine, at);
				const merged = flat.slice(0, off) + inserted + flat.slice(off);
				const p = toPos(merged.split("\n"), off + inserted.length - 1);
				this.commit(merged.split("\n"), p.line, p.col);
			} else {
				const next = [...st.lines];
				next[st.cursorLine] = line.slice(0, at) + inserted + line.slice(at);
				this.commit(next, st.cursorLine, at + inserted.length - 1);
			}
		}
	}

	// ---- render label ----

	render(width: number): string[] {
		const lines = super.render(width);
		if (lines.length === 0) return lines;

		let label = this.mode === "normal" ? " NORMAL " : " INSERT ";

		const pending = `${this.opCount}${this.op ?? ""}${this.count}`;
		if (pending) label = ` ${pending} ` + label.trimStart();

		const last = lines.length - 1;
		const lineStr = lines[last] ?? "";
		if (visibleWidth(lineStr) >= label.length) {
			lines[last] = truncateToWidth(lineStr, width - label.length, "") + label;
		}
		return lines;
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, kb) => new VimEditor(tui, theme, kb));
	});
}
