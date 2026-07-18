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

**Only the completing PR includes `Closes #<n>`.** In a per-layer split, every
earlier layer's PR body must reference the tracked issue without an adjacent
closing keyword — see the "PR body template" section below for the exact
wording rule and an example.

**Auto-close-keyword gotcha — GitHub's substring match ignores tense.**
GitHub auto-closes an issue whenever `close(s)?|fix(es)?|resolve(s)? #N`
appears _anywhere_ in the PR body, even inside prose describing a _future_
action, not just a directive line. A partial-implementation PR that says
"...confirm this live, then **close #399**" gets `#399` auto-closed on merge
regardless — the keyword and number are adjacent, so GitHub's regex fires. If
a PR body must explain that it does **not** close its tracked issue, never
let a closing keyword sit directly next to the issue reference anywhere in
the body: rephrase with intervening words so the two aren't adjacent — e.g.
"revisit and close issue #399 later" breaks the adjacency; "then close #399"
does not.

**If this bites anyway: reopening an issue does not revert board Status.**
This happened for real with #399 — merging a PR whose body had an adjacent
"close #399" auto-closed it, the board's "Pull request merged" workflow set
Status to Done, the issue was manually reopened, but Status stayed on Done.
~2 hours later the board's "Auto-close issue" workflow (fires on Status →
Done) closed #399 again, with no PR/commit reference at all. If a similar
incident recurs, check the board Status field alongside open/closed
state — reopening only fixes one of the two.

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

1. **Extract the PR number and dispatch `ci-watcher`** (primary mechanism,
   #464). `gh pr create`'s stdout (Gate 4) already printed the PR URL, e.g.
   `https://github.com/ValOvinnikov/blog/pull/478` — take the trailing
   number. Dispatch the **`ci-watcher` subagent**
   (`.claude/agents/ci-watcher.md`) via the Agent tool with
   `run_in_background: true`, passing that number explicitly: "watch PR #478
   to completion." **Never pass the branch or the issue number** — issues
   and PRs share one counter, so the PR opened for issue #`<n>` is almost
   never numbered `<n>` itself; passing it would watch the wrong PR (or one
   that doesn't exist) — this is the exact bug the reviewer caught during
   #461's first pass.

   `ci-watcher` runs `gh pr checks <n> --watch` on your behalf and blocks
   _its own_ turn until every check reaches a terminal state
   (success/failure/skipped) — typically a few minutes for this repo's
   workflows. Because it's dispatched in the background, your own turn is
   not blocked: continue other queued work (or respond to the user) until
   notified. This is the reason the watch loop is delegated at all — run
   inline, `--watch`'s polling refreshes land permanently in your own
   context (measured at ~3,000–3,500 tokens for one real PR), paid again on
   every subsequent turn until compaction; delegated, that cost is paid in
   `ci-watcher`'s own disposable context instead.

   **Fallback** if dispatching a subagent isn't viable (background dispatch
   unsupported in the current environment, or another reason a subagent
   genuinely can't be used here) — fall back to watching directly, same as
   before #464: run one non-blocking check yourself, with the explicit PR
   number, never `--watch` synchronously —

   ```
   gh pr checks <n>
   ```

   — report the result honestly, including "pending" if checks haven't
   finished, and tell the user a manual re-check may be needed later (e.g.
   "run `gh pr checks <n>` again in a few minutes"). Never let CI status go
   unreported because the session moved on; a silent "I'll assume it's
   fine" is exactly the gap this gate closes.

2. **`ci-watcher` reports all green:** report that explicitly alongside the
   PR URL. Nothing further to do — Gate 6 governs from here.

3. **`ci-watcher` reports a failure — required or not.** A check outside the
   required list (see the companion issue #462, which promotes some of these
   to required) is not exempt: "not required to merge" is not "safe to
   ignore." `ci-watcher`'s report hands you the failing check name(s), the
   run/job URL, and a raw `--log-failed` excerpt as data — it does not
   diagnose or suggest a fix; that stays your job:

   - Read the excerpt and name the precise cause — compiler/lint error with
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
   - Once pushed, re-dispatch `ci-watcher` on the same PR number (or repeat
     step 1's fallback) and go back to step 2.

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

**`Closes #<n>` is conditional — only the PR that completes the tracked
issue includes it.** In a per-layer split (see "Scope: prefer per-layer PRs"
above), every layer's PR merging first with `Closes #<n>` in its body would
auto-close the issue prematurely, before later layers land. Earlier layer
PRs reference the issue without a closing keyword instead:

```
Part of #<n>
```

or a plain mention with intervening words (e.g. "see #<n> for the full
scope") — never a bare `#<n>` immediately after `close`/`closes`/`fix`/
`fixes`/`resolve`/`resolves`, per the auto-close-keyword gotcha above. Only
the final layer's PR — the one that actually finishes the issue — carries
`Closes #<n>`.
