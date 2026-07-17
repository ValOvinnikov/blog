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

## Scope: prefer per-layer PRs

Split a multi-layer feature into separate PRs per layer (`config → cms →
service → ui → web` when config changes are involved, otherwise `cms →
service → ui → web`; dependency order) — smaller diffs review faster.
**Split only when each layer's PR merges to `main` green on its own**
(typically additive changes).
Keep it a single PR when a partial merge breaks the build — e.g. renaming a
shared `_type`/generated type that downstream references reds `type-check` until
all layers land. One concern per PR still holds either way.

## ABSOLUTE RULES — never violate

- **Never push without explicit user approval for that specific push.**
  Prior push approvals — on other branches, or for an earlier push on this
  same branch — do not carry over. This includes a follow-up push that fixes
  a CI failure found at Gate 5a: ask fresh, every time.
- **Never create a PR without explicit user approval.**
  Ask separately, after the push is confirmed.
- **Never commit without explicit user approval.**
  After finishing work, ask the user: commit now or wait for review?
- **Never ask to commit (Gate 2) before the `reviewer` subagent has returned
  `APPROVE` on the final diff.** New changes after an APPROVE invalidate it —
  re-review before asking again.
- **Never merge.** Merging is the human's call only.
- **Never deploy.** `sanity deploy` and Vercel deploys are human-run only.
- **Never set `--assignee` or `--reviewer` on the PR.** The repo owner cannot
  approve their own PR if they're the assignee. If a second collaborator exists,
  use `--reviewer <them>`.
- **Never push or create a PR directly to `main`.**

## The strict gate sequence

Work through these gates in order. **Stop at each gate and wait for the user.**

### Gate 0 — Pull the issue and set In Progress

1. **Look up the project item ID in memory first.**
   Read `memory/reference_project_item_ids.md` (in the project memory directory).
   If the issue number is in the table, use that ID — skip the API query entirely.

   If it is **not** in the table, fetch it:

   ```
   gh api graphql -f query='{ user(login:"ValOvinnikov") { projectV2(number:2) {
     items(first:100) { nodes { id content { ... on Issue { number } } } } } } }'
   ```

   **Immediately after fetching**, append a new row to
   `memory/reference_project_item_ids.md` using the Edit tool:

   ```
   | #<n>  | PVTI_…      |
   ```

   Do this before setting In Progress — if you skip it, Gate 5 will need
   another API call to find the same ID.

   Keep the item ID in context — it is reused at Gate 5 without another lookup.

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

   If a parent exists and is not already In Progress, look up its item ID the
   same way (memory first, then API) and set it to In Progress.

4. Checkout a new branch from up-to-date `main`:

   ```
   git switch main && git pull --ff-only
   git switch -c issue/<n>-<short-slug>
   ```

   **Exception — worktree-isolating subagents.** When the implementation will
   be delegated to subagents that run in their own git worktrees
   (`develop-feature` multi-layer flow), keep `main` checked out here instead
   of switching: the feature branch is created inside the agent's worktree,
   and you land it from the agent's commit during verification. Switching the
   main checkout too creates two competing copies of the branch.

### Gate 1 — Do the work

- Follow `develop-feature` for implementation and per-layer delegation.
- Run the verify step from `develop-feature` § 5 — single-package, CMS-only,
  or multi-layer sequence depending on what changed. Do not use the simplified
  `pnpm type-check && pnpm lint && pnpm test` shortcut — it misses typegen and
  the web build where required.
- Dispatch the **`reviewer` subagent** (`.claude/agents/reviewer.md`) over the
  final diff — it applies `code-review-practices` (mechanical scan + contract
  pass + general pass). Fix any blocking findings, re-verify, and re-dispatch
  until it returns `APPROVE`. Do not move to Gate 2 without an `APPROVE` on
  the diff as it stands.
- Report results, including the review verdict. Do not proceed past Gate 1 if
  any check is red.

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

Report the PR URL — but hold off on any "done"/"shipped" framing until
Gate 5a below reports CI status. If Gate 5a hasn't run yet, say so explicitly
("PR open, board updated, CI still running — watching checks next") rather
than implying the issue is finished.

### Gate 5a — Watch CI to completion

Not a new approval gate for opening the PR (it runs automatically, right
after Gate 5) — but the pipeline it drives when a check fails still passes
through the normal push-approval gate (Gate 3) every single time, fresh, no
exceptions.

1. **Watch the checks:**

   ```
   gh pr checks --watch
   ```

   Run this with **no argument.** Per `gh pr checks --help`: "Without an
   argument, the pull request that belongs to the current branch is
   selected" — exactly right here, since you're still on the branch Gate 4
   just created the PR from. Do **not** pass the issue number `<n>`: issues
   and PRs share one counter, so the PR opened for issue #`<n>` is almost
   never numbered `<n>` itself — passing it would watch the wrong PR (or one
   that doesn't exist).

   This blocks synchronously until every check reaches a terminal state
   (success/failure/skipped) — typically a few minutes for this repo's
   workflows. Treat that wait as normal foreground work, not something to
   background or schedule around: `--watch` returns on its own once CI
   settles, so there's no separate polling loop to build.

   **Fallback** if `--watch` isn't available (old `gh` version) or the
   session genuinely can't stay attached that long: run one non-blocking
   check instead (same no-argument form) —

   ```
   gh pr checks
   ```

   — report the result honestly, including "pending" if checks haven't
   finished, and tell the user a manual re-check may be needed later (e.g.
   "run `gh pr checks` again in a few minutes"). Never let CI status go
   unreported because the session moved on; a silent "I'll assume it's
   fine" is exactly the gap this gate closes.

2. **All green:** report that explicitly alongside the PR URL. Nothing
   further to do — Gate 6 governs from here.

3. **Any check fails — required or not.** A check outside the required list
   (see the companion issue #462, which promotes some of these to required)
   is not exempt: "not required to merge" is not "safe to ignore." For each
   failing check:

   - List the checks to find the failing job/workflow name (no argument,
     same current-branch PR as above):
     ```
     gh pr checks
     ```
   - Find the run and pull its failing job's log:
     ```
     gh run list --branch <branch> --limit 5
     gh run view <run-id> --log-failed
     ```
     (or, for one job's raw log directly:
     `gh api repos/ValOvinnikov/blog/actions/jobs/<job-id>/logs`).
   - Read the log and name the precise cause — compiler/lint error with
     file:line, the specific failing test name and assertion, a typegen
     drift diff, etc. "CI failed" is not a diagnosis; report what actually
     broke.
   - Fix it like any other implementation work: delegate to the owning
     layer's subagent if the fix lands in a layer file, or fix directly if
     it's tooling/config/docs (this change's own territory).
   - Re-run the specific local verify step from `develop-feature` §5 that
     matches the failing check (e.g. `pnpm --filter web build` for a build
     check, `pnpm test` for a test job) rather than the whole suite blindly.
   - Commit the fix — Gate 2 still applies, ask before committing.
   - **Ask to push again — a fresh, explicit approval, exactly like Gate 3.**
     A push made to fix CI is still a push. The approval for the original
     push does not cover it; ask every time, same branch or not.
   - Once pushed, go back to step 1 and re-watch.

4. **Stop and ask the human** instead of guessing when a failure isn't
   safely automatable — a genuine design/behavior question the fix would
   have to answer, a flaky or infra-only failure that doesn't reproduce
   locally, or a check whose fix requires judgment calls this skill can't
   make for you (e.g. a security-review flag). Report what you found and
   wait; do not push a speculative fix.

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
- <what changed, listed per layer: config / cms / service / ui / web>

## Test plan
- [ ] pnpm typegen (if schema changed)
- [ ] pnpm type-check
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm --filter web build (if web was touched)
- [ ] Storybook stories present (if ui components were added or changed)

Closes #<n>
```
