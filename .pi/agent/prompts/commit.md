---
description: Stage, draft a Conventional Commit message, get approval, then commit (no push)
argument-hint: "[extra context]"
---
Create a git commit for the current changes.

Extra context from me (may be empty): $@

Follow these steps in order:

1. Inspect the working tree. Run `git status` and `git diff` (and `git diff --cached`
   for already-staged changes) to understand what changed. If nothing is staged,
   stage the relevant files with `git add`. Do not stage unrelated files; if the
   changes look like they belong in separate commits, tell me and ask how to split them.

2. Draft ONE commit message in Conventional Commits format. It MUST be a
   single line only, no body and no footer. Multiline messages are for PR
   descriptions, never for commits.
   - Format: `type(optional-scope): summary`
     - `type` is one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
     - imperative mood, lower-case summary, no trailing period, aim for <= 72 chars
     - append `!` after type/scope (e.g. `feat!:`) for a breaking change
   Base the message on the actual diff and the extra context above. If the
   change is too large to describe in one line, tell me it should be split
   into multiple commits rather than writing a multiline message.

3. Ask me to approve the message using the questionnaire tool. Show the full
   proposed commit message in the question prompt, with options:
   - "Approve" — commit as-is
   - "Edit" — I'll type a revised message; use exactly what I provide
   - "Cancel" — stop without committing
   Do not commit before I approve.

4. On approval, create the commit with a single `git commit -m "..."` using the
   approved single-line message. Then show me the result (`git show --stat HEAD`).

Hard rules:

- The commit message is ALWAYS a single line. Never use multiple `-m` flags,
  never include a body or footer, never embed newlines.
- NEVER run `git push` (or any push) unless I explicitly tell you to in this request.
- Never add a `Co-Authored-By` line or any agent attribution.
- Never use em-dashes in the commit message.
- Do not amend or rewrite existing commits unless I ask.
