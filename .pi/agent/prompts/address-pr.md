---
description: Fetch PR review comments, triage each one, and let me decide what to act on
argument-hint: "[PR number or URL]"
---
Review and address feedback on a pull request.

Target PR (may be empty; if empty, use the PR for the current branch): $@

Follow these steps in order:

1. Locate the PR. If a number or URL was given above, use it. Otherwise find the
   PR for the current branch (`gh pr view --json number,url,title,headRefName`).
   If there is no PR, stop and tell me.

2. Fetch ALL reviewer feedback, not just the latest push:
   - Review summaries and their state (approved / changes requested / commented):
     `gh pr view <pr> --json reviews`
   - Inline line comments on the diff:
     `gh api repos/{owner}/{repo}/pulls/<pr>/comments`
   - Top-level PR conversation comments:
     `gh api repos/{owner}/{repo}/issues/<pr>/comments`
   Ignore your own/bot comments and already-resolved threads where possible.
   Focus on actionable reviewer feedback.

3. Summarize each distinct comment ONE BY ONE. For each, give:
   - Who raised it and where (file:line or "general").
   - A one or two sentence summary of what they are asking for.
   - Your recommendation: "Do now" or "Defer", with a short reason. Consider:
     do now = correctness, bugs, security, requested changes blocking approval,
     small/cheap fixes. defer = out-of-scope refactors, nice-to-haves, follow-up
     work better tracked as a separate issue, opinions without a clear ask.
   Present these as a clear numbered list so I can see the full picture first.

4. Let me decide. Use the questionnaire tool to ask, per comment (or grouped if
   there are many), whether to:
   - "Address now" — you will make the change
   - "Defer" — leave it, optionally note it for a follow-up
   - "Skip" — no action, we disagree or it is not applicable
   Do not make any code changes before I choose. Your recommendation is a
   suggestion; my decision wins.

5. For everything I chose to address now, make the changes. Keep them scoped to
   what each comment asked for. When done, show me a summary of what changed and
   which comments it maps to. Do not automatically reply to reviewers, resolve
   threads, commit, or push unless I explicitly ask.

Hard rules:

- Never make changes before I approve them in step 4.
- Never commit or push unless I explicitly tell you to.
- Never add a `Co-Authored-By` line or any agent attribution.
- Never use em-dashes in any output.
- If `gh` is not authenticated or not installed, stop and tell me instead of
  guessing at another method.
