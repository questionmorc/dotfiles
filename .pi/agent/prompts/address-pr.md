---
description: Fetch PR review comments, triage each one, and let me decide what to act on
argument-hint: "[PR number or URL]"
---
Address reviewer feedback on a PR. Target (empty = current branch's PR): $@

1. Locate the PR (`gh pr view --json number,url,title,headRefName`). None: stop and tell me.
2. Fetch ALL feedback: review summaries and state (`gh pr view <pr> --json reviews`), inline diff comments (`gh api repos/{owner}/{repo}/pulls/<pr>/comments`), conversation comments (`gh api repos/{owner}/{repo}/issues/<pr>/comments`). Skip own/bot comments and resolved threads.
3. Numbered list, one entry per distinct comment: who and where (file:line or "general"), the ask in 1-2 sentences, and a recommendation: "Do now" (correctness, security, blocking approval, cheap fix) or "Defer" (out-of-scope refactor, nice-to-have, follow-up issue, opinion without a clear ask).
4. Decision via the questionnaire tool, per comment or grouped when many: Address now / Defer / Skip. My decision wins; code changes start only after it.
5. Make the chosen changes, each scoped to its comment's ask. Report what changed mapped to which comment. Replying to reviewers, resolving threads, committing, pushing: only on my explicit ask.

`gh` missing or unauthenticated: stop and tell me.
