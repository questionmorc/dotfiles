---
description: Push the current branch and open a PR with a concise, high-level description
argument-hint: "[extra context]"
---
Push the current branch and open a pull request.

Extra context from me (may be empty): $@

Follow these steps in order:

1. Sanity-check the branch. Run `git status` to confirm the working tree is
   clean and everything is committed. If there are uncommitted changes, stop and
   tell me. Confirm the current branch is not the default branch (main/master);
   if it is, stop and tell me.

2. Understand the change set. Determine the base branch (usually `main` or
   `master`) and review the full diff against it (`git diff <base>...HEAD` and
   `git log <base>..HEAD --oneline`) so the PR description reflects everything in
   the branch, not just the latest commit.

3. Look for a PR template. Check for one of:
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/pull_request_template.md`
   - any file under `.github/PULL_REQUEST_TEMPLATE/`
   - `docs/PULL_REQUEST_TEMPLATE.md` or a root-level `PULL_REQUEST_TEMPLATE.md`
   If a template exists, fill it out section by section, keeping its headings and
   structure. If none exists, use a simple body with a short summary.

4. Write the PR body as a short, concise, high-level overview of the change:
   - Explain WHAT changed at a high level and WHY, in a few sentences or a few
     bullets. Optimize for a reviewer who will read the diff themselves.
   - Do NOT walk through file-by-file changes or restate anything obvious from
     the "Files changed" tab.
   - Do NOT pad with low-value testing notes (e.g. "checked YAML syntax",
     "ran the linter", "verified it compiles"). Only mention testing if it
     describes how the feature or fix itself was actually exercised, and only
     when that is genuinely useful to the reviewer.
   - Keep it tight. Cut anything that does not help the reviewer decide if the
     change is correct.

5. Push the branch to the remote, setting upstream if needed
   (`git push -u origin HEAD`).

6. Open the PR with the GitHub CLI (`gh pr create`), using a Conventional
   Commit-style title and the body from step 4. Prefer `--body-file` with a temp
   file over inline `--body` so formatting and the template are preserved. After
   creating it, show me the PR URL (`gh pr view --web` is fine, or print the URL).

Hard rules:

- Never add a `Co-Authored-By` line or any agent attribution in the PR body.
- Never use em-dashes in the title or body.
- Keep the description high-level; the diff is the source of truth, not the PR body.
- If `gh` is not authenticated or not installed, stop and tell me instead of
  guessing at another method.
