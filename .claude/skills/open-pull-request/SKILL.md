---
name: open-pull-request
description: >-
  Use when the user asks to put work on a branch, open a pull request, or ship
  an issue for review in this repo. Covers the branch → work → verify → PR loop
  and the strict human-gated approval sequence.
---

# Open a pull request (branch → work → PR)

The delivery loop for this repo. `develop-feature` says how to _build_ a change;
this skill says how to _ship it for review_.

## ABSOLUTE RULES — never violate

- **Never push without explicit user approval for that specific push.**
  Prior push approvals on other branches do not carry over. Ask every time.
- **Never create a PR without explicit user approval.**
  Ask separately, after the push is confirmed.
- **Never commit without explicit user approval.**
  After finishing work, ask the user: commit now or wait for review?
- **Never merge.** Merging is the human's call only.
- **Never deploy.** `sanity deploy` and Vercel deploys are human-run only.
- **Never set `--assignee` or `--reviewer` on the PR.** The repo owner cannot
  approve their own PR if they're the assignee. If a second collaborator exists,
  use `--reviewer <them>`.
- **Never push or create a PR directly to `main`.**

## The strict gate sequence

Work through these gates in order. **Stop at each gate and wait for the user.**

### Gate 0 — Pull the issue and set In Progress

1. Find the GitHub Project item for the issue:
   ```
   gh api graphql -f query='{ user(login:"ValOvinnikov") { projectV2(number:2) {
     items(first:50) { nodes { id content { ... on Issue { number } } } } } } }'
   ```
2. Set status → **In Progress** (`47fc9ee4`) for the issue being worked on:
   ```
   gh api graphql -f query='mutation {
     updateProjectV2ItemFieldValue(input:{
       projectId:"PVT_kwHOAIMQW84BcK3T"
       itemId:"<ITEM_ID>"
       fieldId:"PVTSSF_lAHOAIMQW84BcK3TzhW1nPs"
       value:{singleSelectOptionId:"47fc9ee4"}
     }) { projectV2Item { id } }
   }'
   ```
3. **If the issue is a sub-issue, also set its parent to In Progress.**
   Check whether the issue has a parent:

   ```
   gh api graphql -f query='{ repository(owner:"ValOvinnikov", name:"blog") {
     issue(number:<n>) { parent { number } } } }'
   ```

   If a parent exists and is not already In Progress, set it to In Progress using
   the same mutation with the parent's project item ID.

4. Checkout a new branch from up-to-date `main`:
   ```
   git switch main && git pull --ff-only
   git switch -c issue/<n>-<short-slug>
   ```

### Gate 1 — Do the work

- Follow `develop-feature` for implementation and per-layer delegation.
- Run the verify step from `develop-feature` § 5 — single-package, CMS-only,
  or multi-layer sequence depending on what changed. Do not use the simplified
  `pnpm type-check && pnpm lint && pnpm test` shortcut — it misses typegen and
  the web build where required.
- Run `code-review-practices` over `git diff`. Fix any blocking issues (layer
  boundaries, type safety, missing `.notNull()`, `next/link` usage) before
  proceeding. Do not move to Gate 2 with known violations.
- Report results. Do not proceed past Gate 1 if any check is red.

### Gate 2 — Ask to commit

Present the user with two explicit options:

> "Work is complete and all gates pass. Would you like me to **commit now**, or do you want to **review the changes first** before I commit?"

Wait for the user's answer. Do not commit until they say to.

### Gate 3 — Ask to push

After the commit is made, ask:

> "Changes committed. Ready to push branch `issue/<n>-<short-slug>` to origin — shall I go ahead?"

Wait for explicit approval. Do not push until the user confirms.

### Gate 4 — Ask to create the PR

After the push succeeds, ask:

> "Branch pushed. Shall I open the pull request now?"

Wait for explicit approval. Only then run:

```
gh pr create --base main \
  --title "<conventional title>" \
  --body "<summary + test plan + Closes #<n>>"
```

### Gate 5 — Set Code Review on the board

Immediately after the PR is created, set status → **Code Review** (`679cfd06`):

```
gh api graphql -f query='mutation {
  updateProjectV2ItemFieldValue(input:{
    projectId:"PVT_kwHOAIMQW84BcK3T"
    itemId:"<ITEM_ID>"
    fieldId:"PVTSSF_lAHOAIMQW84BcK3TzhW1nPs"
    value:{singleSelectOptionId:"679cfd06"}
  }) { projectV2Item { id } }
}'
```

Then report the PR URL.

### Gate 6 — Done (automatic on merge)

The `Closes #<n>` in the PR body closes the issue on merge.
The board moves to **Done** (`98236657`) automatically via the GitHub integration.
Do not manually set Done.

## Board IDs (hardcoded for this project)

| Key             | Value                            |
| --------------- | -------------------------------- |
| Project ID      | `PVT_kwHOAIMQW84BcK3T`           |
| Status field ID | `PVTSSF_lAHOAIMQW84BcK3TzhW1nPs` |
| Todo            | `f75ad846`                       |
| In Progress     | `47fc9ee4`                       |
| Code Review     | `679cfd06`                       |
| Done            | `98236657`                       |

## PR body template

```
## Summary
- <what changed, listed per layer: cms / service / ui / web>

## Test plan
- [ ] pnpm typegen (if schema changed)
- [ ] pnpm type-check
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm --filter web build (if web was touched)
- [ ] Storybook stories present (if ui components were added or changed)

Closes #<n>
```
