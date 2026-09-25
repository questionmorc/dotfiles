---
description: Dispatch bd ticket(s) or a plan file to new tmux window(s), each in its own worktree, driven by /implement or by superpowers subagent-driven development
argument-hint: "<bd-id... | plan.md> [implement|superpowers] [worktree:/branch:/base:/persona:/rules/commit/auto]"
---
Dispatch each target to its own tmux window. Args: $@

1. Parse args:
   - Targets: bd ticket IDs, or a path to a markdown plan (one plan = one window).
   - Driver token: `implement` (aliases: pipeline, orchestrator) or `superpowers` (aliases: sdd, subagent, implementer). Default: `implement` for bd IDs, `superpowers` for a plan file.
   - `persona:<names>` overrides the driver's persona. Otherwise: `implement` spawns with no persona flag (the window's default persona), `superpowers` spawns with `persona: superpowers`.
2. Pre-flight per target. bd ticket: `bd show <id>`; blocked by open dependencies, or no acceptance criteria: stop and tell me (the window treats the ticket as the plan; a thin ticket wastes a spawn). Plan file: read it; no discrete ordered tasks, or it reads as a spec rather than a plan: stop and tell me.
3. Names: short slug from the ticket title or the plan filename. worktree `.worktrees/<slug>`, branch `<type>/<slug>` (type from the work: feat/fix/test/chore), window `<slug>`. Explicit args override any of these.
4. Worktree: `git worktree add <repo-root>/.worktrees/<slug> -b <branch> <base>`; base = current branch unless args name one (stacked bases are normal). Then verify `bd context` from inside the worktree resolves to the repo's beads dir (a failed resolve silently creates a rogue `.beads` there; delete it and stop). Seeding: repo needs gitignored generated artifacts (check the repo's setup docs or KB note), copy from a known-good sibling worktree with `rsync -a`; unsure, ask me.
   Plan file living outside the worktree: pass its absolute path so the window can read it.
5. Task line, per driver:
   - `implement`: `/implement <bd-id or plan path> (worktree: <path>, branch: <branch>[, <wave rules from args>][, commit locally, no push])`.
   - `superpowers`: a self-contained brief, no slash command:
     `Execute <bd-id: run 'bd show <id>' for the plan | the plan at <abs path>> with the subagent-driven-development skill. You are already in worktree <path> on branch <branch>: do not create a worktree and do not run finishing-a-development-branch. Never merge, never push[, commit locally as you go]. <wave rules from args>. Report the ledger when the plan is done.`
   Include the commit grant only when args say commit.
6. Spawn: `spawn_agent` mode=fresh, placement=window, launch=wait (args say auto: launch=auto), name=<slug>, workdir=<absolute worktree path>, task=<the line>, persona=<from step 1, omitted for the implement default>.
7. Several targets: repeat per target, one worktree + window each. Merge-back and worktree cleanup happen from this session via /merge-back (git-integrator subagent); spawned windows never merge or push.

Report per window: name, driver, persona, worktree, branch, task line.
