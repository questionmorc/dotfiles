---
description: Stage, draft a Conventional Commit message, get approval, then commit (no push)
argument-hint: "[extra context]"
---
Commit the current changes. Extra context (may be empty): $@

1. Inspect the working tree; stage the relevant files if nothing is staged. Unrelated changes mixed in, or multiple logical changes: stop and ask how to split.
2. Draft ONE single-line message: `type(scope): summary`. type is one of feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert; imperative, lower-case, no trailing period, <=72 chars; `!` after type/scope for breaking. Too big for one line means it should be split into commits; say so instead of writing a body.
3. Approval via the questionnaire tool, showing the full message: Approve / Edit (use my text verbatim) / Cancel. Commit only after approval.
4. `git commit -m` with the approved message, then show `git show --stat HEAD`.

Rules: one `-m` only. No push. No amending or rewriting existing commits.
