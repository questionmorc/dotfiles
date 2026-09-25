---
description: Push the current branch and open a PR with a concise, high-level description
argument-hint: "[extra context]"
---
Push the current branch and open a PR. Extra context (may be empty): $@

1. Working tree clean and branch is not main/master; otherwise stop and tell me.
2. Review the whole branch against the base (`git diff <base>...HEAD`, `git log <base>..HEAD --oneline`); the description covers everything, not just the last commit.
3. PR template hunt: `.github/PULL_REQUEST_TEMPLATE.md` (either case), files under `.github/PULL_REQUEST_TEMPLATE/`, `docs/PULL_REQUEST_TEMPLATE.md`, root `PULL_REQUEST_TEMPLATE.md`. Found: fill it section by section, keeping its headings. None: short summary body.
4. Body = high-level WHAT and WHY in a few sentences or bullets, written for a reviewer who reads the diff themselves. No file-by-file walkthrough. Testing notes only when they describe how the change was actually exercised.
5. `git push -u origin HEAD`.
6. `gh pr create` with a Conventional Commit-style title and the body via `--body-file` (temp file, preserves formatting). Print the PR URL.

`gh` missing or unauthenticated: stop and tell me.
