# Global Instructions

## Restrictions

- No commits or pushes unless I explicitly ask. `/commit`, `/open-pr`, `/merge-back`, or a direct instruction in the current request counts as explicit, and then you comply. Absent that, I make the commits.
- Commit messages are always a single line in Conventional Commits format: no body, no footer, no Co-Authored-By or other agent attribution (nor in PR descriptions).
- Never use em-dashes in prose or docs. Rewrite the sentence with a comma or a period, whichever is grammatically correct. Do not substitute a hyphen.
- Use `yq` for YAML and `jq` for JSON parsing/validation. Never use inline Python.
- Never reference bd (beads) issue IDs in code, comments, commit messages, PR descriptions, or any documentation. They are agent-local only. Mention them solely in chat. See Issue Tracking.

## Clean Code & TDD

- Strive for clean code. Apply SOLID principles when designing, writing, or reviewing code; the `clean-code` skill has the detail.
- If strict SOLID adherence would be overengineering for the use case at hand, do not silently apply it or silently skip it. Flag the tension, propose the simpler alternative, and let the user decide.
- TDD is the preferred way of working. Default to test-first (use the `tdd` skill) unless it is clearly impractical (throwaway spikes, pure config, trivial changes), and say so explicitly when skipping it.
- Testing follows Kent Beck and Martin Fowler principles: test behavior at public seams, self-testing code, red-green in vertical slices. The `tdd` skill is the reference.

## Code Comments

- Default to zero inline comments. Add one only when the code cannot reasonably be understood without it.
- A comment states WHAT the code does, in one short sentence. Nothing else.
- Never write reasoning walkthroughs, design justifications, decision history, or references to alternatives in comments. That context belongs in the commit message, PR description, or chat.
- Never add comments that narrate an edit ("changed X to Y", "now uses Z") or restate what the code obviously says.
- The same rules apply to docstrings beyond their required one-line summary, and to comments in YAML, CI workflows, and config files.

## Verifying your work

There is no automatic diagnostic feedback on edits. After a multi-file or multi-step change, run the project's own typecheck, lint, and test commands before declaring the work done. When mid-way through a planned change, finish the planned edits first rather than reacting to transient breakage from not-yet-written code.

## Unity AI work

For anything touching Unity Muse / AI Authoring (the muse, muse-editor, muse-skills, proton-service, unity-hub / CoCreate, kb_service repos, the team, releases, on-call, alerts, or AINF Jira), use the `unity-kb` skill and query the KB before exploring code. The skill has the full workflow.

## Issue Tracking

This project uses **bd (beads)** for issue tracking.
Run `bd prime` for workflow context, or install hooks (`bd hooks install`) for auto-injection.

**Scope: JIRA is my (human) tracker; bd is the agents' workspace.**

- I track real work in the org's JIRA. bd does not replace, mirror, or sync with JIRA. Do not treat bd IDs as JIRA issues.
- Work gets planned with agents and broken into smaller units in bd; orchestrators receive implementation tickets as bd issues (e.g. `/implement <bd-id>`).
- Never write bd issue IDs into code, comments, commit messages, PR descriptions, docs, or any committed or shared artifact. They are meaningless outside this local tracker and only add noise.
- Surface bd IDs only in chat with the user.

**Quick reference:**

- `bd ready` - Find unblocked work
- `bd create "Title" --type task --priority 2` - Create issue
- `bd close <id>` - Complete work
- `bd dolt push` - Push beads to remote

For full workflow details: `bd prime`
