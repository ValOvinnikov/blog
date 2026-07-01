---
name: open-pull-request
description: >-
  Use when the user asks to put work on a branch, open a pull request, ship an
  issue for review, or assign a PR reviewer/assignee in this repo. Covers the
  branch → work → verify → PR → assign loop and the human-gated push rules.
---

# Open a pull request (branch → work → PR → assign)

The delivery loop for this repo. `develop-feature` says how to *build* a change;
this skill says how to *ship it for review*. Work never lands directly on
`main` — each issue gets a branch and a PR that the owner reviews.

## Core rules (do not violate)

- **Pushing is confirm-gated.** `git push` is neither allowed nor denied in
  `.claude/settings.json`, so every push triggers a permission prompt the user
  approves. Only push **after the user says to** ("ship it" / approves the
  prompt) — never proactively, and never to `main`.
- **PR creation is confirm-gated too.** `gh` isn't denied; running `gh pr
  create` prompts once. Push the branch, then open the PR on the same go-ahead.
- **Deploys stay denied** (`sanity deploy`, Vercel) — human-run only.
- **Never merge.** Merging and deploys are the human's call.
- **One concern per PR.** Conventional commits; verify the gates first.

## The loop

1. **Branch from up-to-date `main`.**
   `git switch main && git pull --ff-only` → `git switch -c issue/<n>-<short-slug>`
   (e.g. `issue/3-restore-type-check`).
2. **Do the work** — follow `develop-feature`, delegating per layer. Commit in
   conventional style, one concern.
3. **Verify before proposing a PR** (all must pass from root):
   `pnpm type-check && pnpm lint && pnpm test && pnpm build`.
   Report the results. Do not offer a PR on red.
4. **Ask to open the PR.** If not already told, confirm with the user first.
5. **On confirm — push + PR:**
   ```
   git push -u origin issue/<n>-<short-slug>
   gh pr create --base main --assignee ValOvinnikov \
     --title "<conventional title>" \
     --body "<summary + test plan + Closes #<n>>"
   ```
6. **Report the PR URL.** Leave it for the owner to review and merge.

## Gotchas

- **Assign the owner as `--assignee`, NOT `--reviewer`.** The PR is authored by
  the owner's own `gh` token (`ValOvinnikov`), and GitHub **rejects requesting
  review from the PR author**. `--assignee ValOvinnikov` puts it on their plate;
  `--reviewer ValOvinnikov` errors. (If a second collaborator ever exists, use
  `--reviewer <them>`.)
- **Push/PR prompt every time by design.** They're deliberately kept out of the
  `allow` list so each is confirm-gated. Don't try to "fix" the prompt by
  allow-listing them without the user asking.
- **Link the issue** with `Closes #<n>` in the body so the merge auto-closes it
  and updates the Project board.

## PR body template

```
## Summary
- <what changed, per layer>

## Test plan
- [ ] pnpm type-check
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm build

Closes #<n>
```
