---
description: Merge dispatched worktree branches into the integration branch via the git-integrator subagent, then approve cleanup
argument-hint: "[branch|slug...] [into:<branch>] [strategy:squash|merge] [confirmed]"
---
Merge the dispatched ticket branches back into the integration branch. Args: $@

Do not run merge/cleanup git commands in this session; the `git-integrator` subagent does all git surgery.

1. Resolve inputs: integration branch = `into:` arg, else current branch (`git rev-parse --abbrev-ref HEAD`). Branches = args (slugs resolve via `git worktree list --porcelain`), else every worktree under `.worktrees/`. Strategy = `strategy:` arg, else squash. Order = args order; stacked branches base-first.
2. Integration branch is main/master and args lack `confirmed`: stop and ask me.
3. Delegate merge: `subagent` single mode, agent `git-integrator`, cwd = repo root. Task lists: job `merge`, integration branch (plus "confirmed" when step 2 passed), strategy, ordered `branch @ worktree` pairs, "verify: typecheck/build + full test suite".
4. Relay the report verbatim. Any conflict, skip, or check failure: stop, suggest next step (redispatch that ticket's window, or /implement a fix) and wait for me.
5. All clean: questionnaire for cleanup approval, listing exactly which worktrees get removed and which branches get deleted. Approved: second `git-integrator` call, job `cleanup`, stating my approval, same pairs. Relay result.
6. Never push. PR happens separately via /open-pr.
