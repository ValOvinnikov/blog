---
name: open-pull-request
description: >-
  Use when the user asks to put work on a branch, open a pull request, or ship
  an issue for review in this repo. Covers the branch → work → verify → PR loop
  and the strict human-gated approval sequence.
---

# Open a pull request (branch → work → PR)

`develop-feature` says how to _build_ a change; this skill says how to _ship it
for review_. `CLAUDE.md` "Delivery gate sequence" is the summary; the full sequence ("Delivery gate sequence" below) and the mechanics are here.

`<n>` is always the **issue** number; `<pr>` is the PR number `gh pr create`
printed. Issues and PRs share one counter, so the two are almost never equal.

## Scope: prefer per-layer PRs

One PR per layer, merged before the next starts — `develop-feature` "Split by workspace, always" and "One layer at a time — merged before the next starts".

In a split, **only the completing PR carries `Closes #<n>`** — the wording
rule and the auto-close traps are under "PR body template" below.

### Stacked PRs — only on the user's say-so, then `gh stack`

A stack is the user's call, never the orchestrator's. Once they ask for one,
**read `stacked-prs.md` (beside this file) first** — the `gh stack` commands,
what a non-interactive `submit` leaves to fix, and collapsing a stack. Three
rules hold without it: every `gh stack` command that pushes needs its own
Gate 3 approval (and `submit` Gate 4 too), never run `gh stack merge`, and
never hand-roll a stack with `gh pr create --base <branch>`.

## ABSOLUTE RULES — never violate

- **Never push without explicit approval for that specific push.** No earlier
  approval carries over — not another branch's, not an earlier push on this
  one, not the original push before a Gate 5a CI fix. A `gh stack` command
  that pushes is a push.
- **Never create a PR without explicit approval**, asked separately after the
  push succeeds.
- **Committing needs no approval** — it is local and reversible.
- **Never push before review passes on the final diff**: every dispatched
  reviewer's `APPROVE`/`PASS` (`develop-feature` §6), or for a docs-only diff
  the inline identifier check ("Delivery gate sequence" step 4 below). Any later
  change invalidates it, a merge from `origin/main` included.
- **Never merge, never deploy.** Both are the human's.
- **Never set `--assignee` or `--reviewer` on the PR** — an owner assigned to
  their own PR cannot approve it. With a second collaborator,
  `--reviewer <them>` is fine.
- **Never push to `main` directly or open a PR from it.**

## The gate sequence

Committing is free; stop at Gates 3 and 4 and wait for the user.

### Gate 0 — Set In Progress, then branch

1. Dispatch `board-keeper` **synchronously** with `"starting work on #<n>"` —
   one of the two synchronous dispatches (`develop-feature` "Use the scoped agents" → "Dispatch subagents in the background by default"), because the checkout below depends on it. It
   sets the issue, and a Todo or blank parent, to In Progress and re-verifies
   each write (`board-keeper.md` Step 1d). Sibling sub-issues starting
   together are **one** dispatch: `"starting work on #86, #87, #88, #89"`.
2. Branch from a fresh `origin/main`. Never `git switch main`: in a worktree
   it fails, because the main checkout already has `main` checked out.

   ```
   git fetch origin
   git switch --no-track -c "$(pnpm -s branch:name <n> "<issue title>")" origin/main
   ```

   A session already on a generated `claude/…` branch renames it instead:
   `git rebase origin/main`, then
   `git branch -m "$(pnpm -s branch:name <n> "<issue title>")"`.

   `scripts/branch-name.mjs` holds the one pattern, `<type>/<n>-<slug>` with
   a commitlint type; `main`, `dependabot/…` and the `@claude` Action's
   `claude/issue-<n>-<YYYYMMDD>-<HHMM>` are the only other names allowed.
   `board-keeper` and `board-auto-sync.yml` read the issue from that shape.
   Creating a branch under any other name is refused at push by
   `.claude/hooks/pre-bash-branch-name-guard.sh` and `.husky/pre-push`, and
   fails `board-auto-sync.yml`'s `branch-name` check on the PR. A branch
   already on the remote keeps pushing, so open PRs are unaffected.

   **Worktree-delegated work:** when layer subagents run in their own
   worktrees (`develop-feature` §3) and this session is the shared main
   checkout, leave it on `main`. The feature branch is created in the agent's
   worktree and landed from its commit; switching here too makes two
   competing copies of the branch.

### Gate 1 — Do the work, verify, review

Follow `develop-feature` §3–§6: merge `origin/main` in first, `pnpm typegen`
when a schema changed, `verify-runner` with `pnpm verify`, then every required
reviewer until each passes. A merge from `main` after verify or review sends
the branch back through both. Report the results and the review verdict, and
never leave Gate 1 on red.

### Gate 2 — Commit

Commit the reviewed work — no approval needed. Then Gate 3.

### Gate 3 — Ask to push

> "Changes committed. Ready to push branch `<type>/<n>-<short-slug>` to origin — shall I go ahead?"

For a docs-only diff, say it was docs-only and identifier-checked. Push only on
an explicit yes.

### Gate 4 — Ask to open the PR

> "Branch pushed. Shall I open the pull request now?"

Only on an explicit yes. Always pass `--head`: without it `gh` uses the
current branch, which is `main` in a checkout left there for
worktree-delegated work. Always pass `--draft`: CI skips drafts, so the
review-fix pushes that follow most reviews cost no CI minutes, and the owner
marks the PR ready at final review, which runs the full gate once.

```
gh pr create --draft --base main --head <type>/<n>-<short-slug> \
  --title "<conventional title>" \
  --body "<per the PR body template below>"
```

### Gate 5 — Board to Code Review, then the job label

1. **Dispatch `board-keeper` synchronously with `"after PR #<n>"`** — the
   issue number, not `<pr>` (`board-keeper.md` Step 1c). It confirms the
   issue reached Code Review — `board-auto-sync.yml` has usually moved it
   already — writes it if not, and re-verifies. This is the second
   synchronous dispatch and also the "after PR" reconciliation of "Board reconciliation" below — don't dispatch it twice.
2. **Tag the PR with this job's label**, so concurrent background jobs' PRs
   are tellable apart in the PR list. **Skip silently when `$CLAUDE_JOB_DIR`
   is unset** — a foreground session has no job and nothing to disambiguate,
   and a missing chip is not a failure. When it is set, run the commands in
   `job-label.md` (beside this file): the label is the session's slugified
   name (the id only for an unnamed job), and a renamed session renames its label rather than
   minting a second one.

3. **Report the PR URL** only once the board write is confirmed, and hold any
   "done"/"shipped" framing until Gate 5a reports — say "Draft PR open, board
   updated — CI runs once it is marked ready".

A solo cloud session does neither step 1 nor step 2, and never substitutes an
MCP or REST call for them (`CLAUDE.md` "Solo-session mode").

### Gate 5a — Watch CI to completion

Runs once the PR is marked ready for review — never on a draft, where `CI`
reports green with every job skipped, so a watch would report a pass that
tested nothing. The owner marks it ready at final review: either in GitHub,
then telling the session, or by asking the session to run `gh pr ready <pr>`.
Every fix push still goes through a fresh Gate 3.

1. **Dispatch `ci-watcher` in the background with `<pr>`** — the trailing
   number of the URL `gh pr create` printed, never the issue number or the
   branch. The agent absorbs `--watch`'s polling output so your context
   doesn't; stay responsive until it reports.

   **Fallback** when a subagent can't be dispatched: run `gh pr checks <pr>`
   once — never `--watch` inline — report the result honestly, "pending"
   included, and tell the user to re-check later. CI status never goes
   unreported.

2. **All green:** say so with the PR URL. Gate 6 governs from here.
3. **Any failure, required or not** — "not required to merge" is not "safe to
   ignore". `ci-watcher` hands over the check names, run URLs and a
   `--log-failed` excerpt; the diagnosis is yours:
   - Name the precise cause — `file:line`, the failing test and assertion,
     the typegen drift. "CI failed" is not a diagnosis.
   - Route the fix to the owning layer agent; fix it yourself only when the
     file is outside every agent's scope (`develop-feature` "Use the scoped agents").
   - Re-run the local step matching the failing check (`develop-feature` §5);
     `pnpm --filter <web|platform> build` only to diagnose a `Build` failure.
   - Re-run `verify-runner` with `pnpm verify`, then re-dispatch every
     required reviewer until each passes (`develop-feature` §5–§6) — for a
     docs-only fix, the inline identifier check instead. The fix is a new
     diff; the earlier pass does not cover it.
   - Commit, then **ask to push afresh**, exactly as at Gate 3.
   - Re-dispatch `ci-watcher` on the same `<pr>` and return to step 2.
4. **Stop and ask** rather than push a speculative fix when the failure needs
   a design or behaviour decision, is flaky or infra-only and doesn't
   reproduce locally, or needs a judgment call such as a security-review flag.

### Gate 6 — Merge (the human's)

`Closes #<n>` closes the issue on merge and the board's "Item closed" workflow
moves it to Done — never set Done by hand. After the merge, dispatch
`board-keeper` with `"after merge of #<n>"`.

## PR body template

**A highlight list, not a write-up. Hard cap: 12 lines and 1200 characters.**
If it doesn't fit, it is describing the diff instead of summarising it — cut,
don't reformat.

```
<one sentence: what this PR makes possible that wasn't possible before>

## Summary
- <layer>: <what changed — one line per layer touched>

Manual test: #<m>
Closes #<n>
```

- **`Manual test: #<m>`** — the completing PR links its manual-test issue,
  never with a closing keyword (→ `develop-feature` §2 "Manual-test issue").
  Drop the line when there is none.
- **`Closes #<n>` goes only on the PR that completes the issue.** Earlier
  layer PRs write `Part of #<n>`, or a mention with words between keyword and
  number ("see #<n> for the full scope").
- **No test-plan checklist.** The gates require the checks before commit and
  CI re-runs them on the PR, so a hand-ticked copy proves nothing. Mention
  verification only when it isn't routine: a check knowingly red, a step
  deliberately skipped, something a reviewer must run by hand.

**Never in a PR body** — each is the diff restating itself:

- Code blocks — snippets, before/after pairs, type signatures.
- Per-file or per-function enumeration.
- Design-rationale sections; one line of _why_ belongs in the opening
  sentence, the rest in the code or the issue.
- Test narration ("verified the test fails without the fix by …").
- A table restating the Summary.

Before opening, ask of each sentence: **does it tell the reviewer something
the diff cannot?** If not, delete it. Genuine exceptions — a migration's
rollback plan, a deliberate behaviour change a reviewer would otherwise flag
as a bug, a known-broken check — get a sentence or two each.

### Closing keywords — the auto-close traps

GitHub closes an issue whenever one of its nine keywords — `close`, `closes`,
`closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved` — sits
directly before `#N` **anywhere**: in a PR body, in any tense ("…then close
#N", "fixed #N"), and in commit messages — the squash-merge message too, which
can be edited at merge time and diverge from the reviewed body.

- In a PR that must not close its issue, keep words between any closing
  keyword and the number: "revisit and close issue #N later", never
  "then close #N".
- When writing about this trap — in a PR, issue, doc or commit message — use
  the `#N` placeholder; a real issue number never directly follows a closing
  keyword.
- **If it bites, reopen the issue and confirm its Status left Done.** The
  board's "Item reopened" workflow moves it from Done to In Progress; check
  with an independent read of the item (`board-keeper.md` Step 4's `node(id:)`
  query). If it is still Done, move it back yourself — a backward move
  `board-keeper` reports but never makes — and re-read it the same way. Then
  check both the PR body and the actual merge commit message for the trigger.

## Delivery gate sequence (mandatory — never skip or bundle)

Every issue follows this exact order. **Committing is free (no approval
needed); stop and wait for explicit user approval at the push and PR gates.**
(In a solo cloud session, steps 1 and 7's board writes and step 4's `reviewer`
dispatch are replaced as `CLAUDE.md` "Solo-session mode" describes — every other step,
including both approval gates, is unchanged.)

The steps are the gates above, numbered for citation: steps 1–2 are Gate 0,
3–4 Gate 1, 5 Gate 2, 6 Gate 3, 7 Gates 4–5a, and step 8 follows Gate 3.

1. Set issue → In Progress on the board
2. Checkout branch from `main`, named by
   `pnpm -s branch:name <n> "<issue title>"` (`<type>/<n>-<slug>`; any other
   name is refused at push)
3. Do the work + run quality gates — merge `origin/main` in before verify
   (`develop-feature` §5).
4. **Dispatch the `reviewer` subagent** (`.claude/agents/reviewer.md`) over the
   full diff — fix blocking findings and re-dispatch until it returns
   `APPROVE`. Never **push** without an `APPROVE` on the diff as it stands; new
   changes invalidate a prior `APPROVE`, including a later merge from
   `origin/main`.

   **A docs-only diff skips the `reviewer` and gets an inline identifier check
   instead.** Docs-only means nothing outside `docs/**`, `SPEC.md`,
   `README.md`, `CLAUDE.md` and `.claude/**/*.md` — a `.sh`/`.js` file under
   `.claude/` (a hook, a guard script) is executable tooling and gets a
   `reviewer` like any code change, and `.claude/hooks/**` and `scripts/*.sh`
   changes also need the local `shellcheck` + guard-test pass
   (`develop-feature` §5). Identifier mismatches are all a docs review ever
   catches, at ~10 minutes and ~150k tokens a dispatch, so check them by hand
   before committing: grep every code identifier, path and issue number the
   diff names against `origin/main` and `gh`, and re-read any sibling doc the
   change duplicates a decision into (a feature page, `docs/ROADMAP.md`, an
   epic body). State in the push ask that the diff was docs-only and
   identifier-checked.

5. **Commit** the reviewed work — no approval needed; committing is free (local
   and reversible). Don't push it yet.
6. **Ask to push** — explicit approval required; separate question; wait for
   answer.
7. **Ask to open PR** — separate question, after push; wait for answer. Once
   approved: run `gh pr create --draft`, then **immediately** set the issue →
   Code Review on the board — do not report the PR URL until that update is
   done — and tag the PR `job:<session-name>` so concurrent background jobs stay
   tellable apart in the PR list: the session's slugified **name**, never its
   id (`job:static-generation`, not `job:ab922b91`), skipped silently in a
   foreground session and never applied in a cloud one (mechanics, including a
   renamed session: Gate 5 above). The label identifies the job,
   not the author — PRs are always opened by the orchestrator, never a
   subagent. CI skips drafts; the owner marks the PR ready at final review,
   and only then dispatch `ci-watcher` (background) to watch CI to completion,
   and diagnose and fix any failure it reports (Gate 5a above) —
   a fix push still needs its own fresh push-approval ask, same as any push.

8. **Remove the subagent worktrees you created** (no gate — just do it;
   `worktree-agent-*` branches are never pushed, so nothing else sweeps them).
   **The trigger is the push at step 6, not the PR** — a pushed branch is
   recoverable, which is the entire safety condition. A layer-agent worktree
   goes once its patch is landed on the `feat/` branch; the session's own
   feature worktree stays until CI is green, so a Gate 5a fix has somewhere to
   happen. The same pass deletes the scratchpad transfer buffers
   (`.claude/scratchpad*/`) this session's agents exported into — after the
   push, since an export can be the only surviving copy until then. Safety
   checks: `develop-feature` step 8. Never delete uncommitted work, and:

   - **Only what _this session_ created.** Parallel jobs share
     `.claude/worktrees/` and the scratchpad tree, so build the list from your
     own dispatch record, never from `git worktree list` or a wildcard
     `rm -rf` — a scratchpad has no lock file. A worktree with a lock file
     (`$(git rev-parse --git-common-dir)/worktrees/<name>/locked`) is a live
     session's: skip it, and never answer
     `fatal: cannot remove a locked working tree` with `-f -f` or
     `git worktree unlock`.
   - **A worktree-isolated session exits its worktree first** — inside one,
     `git -C <other worktree>` and `git worktree remove` are refused. Once the
     branch is pushed and CI has settled, call `ExitWorktree` with
     `action: "keep"`, then run this step unchanged, own worktree included. If
     the job must end before the push, do **not** clean up: report the exact
     worktree and scratchpad paths, and the next non-isolated session sweeps
     them under the same ownership checks.

**Broad instructions ("go ahead", "keep going", "pick the next issue")
authorize the work and commits — never the push or PR.** Those two gates always
require fresh, explicit confirmation.

**Board reconciliation (not a gate — no approval needed).** After step 7 opens a
PR, and again after any PR merges, dispatch `board-keeper` with a targeted
trigger (`"after PR #<n>"` / `"after merge of #<n>"`); it re-queries every
status write, because board mutations fail silently. A targeted dispatch checks
that one issue — append "...also reconcile the board" for a specific reason to
look further, or dispatch it bare for a full sweep (when asked, at the start of
a session, or before answering a project-status question). It never edits code
and applies only safe, forward-only corrections; anything destructive (e.g.
reopening a wrongly-closed issue) comes back in its report for you to act on.
For an epic's PR, the user gets the table in the `report-epic-status` skill, never a
retelling of the report.

## PR conventions

- **Conventional commits, one concern per PR.** `.husky/commit-msg` runs
  commitlint (`commitlint.config.mjs`) on every local commit — the only
  enforcement, so a commit that bypasses the hook (`--no-verify`, the GitHub
  web UI, a clone where `pnpm install` has not run) is caught nowhere else.
  Allowed types: config-conventional's defaults (`build`, `chore`, `ci`,
  `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`) plus
  this repo's `tooling`; scope is free-form (component/area name) but
  lower-case. Merge commits are skipped; Dependabot's `chore(deps): …` passes
  because it is already conventional.
- **A PR body is a highlight list — 12 lines and 1200 characters, hard cap.**
  One line of what this makes possible, one line per layer touched, on the
  completing PR the manual-test issue link (never with a closing keyword), and
  `Closes #<n>`. No code blocks, no per-file or per-function enumeration, no
  design-rationale sections, and **no test-plan checklist** — the gates already
  require the checks to pass and CI re-runs them, so a hand-ticked copy proves
  nothing. Full contract: "PR body template" above.
- **Per-layer PRs are required** (`develop-feature` "Planning work — mandatory, not advisory" governs). **Only the completing PR includes `Closes #<n>`** — earlier layer
  PRs reference the issue without an adjacent closing keyword, because GitHub
  auto-closes on the literal substring regardless of tense. Exact wording rule
  and the board-Status gotcha when an issue is auto-closed early:
  "Scope: prefer per-layer PRs" and "PR body template" above.
- **Stacked PRs — only when the user asks, and then use `gh stack`.** The
  orchestrator never opens a stack on its own initiative. When the user says
  to, use the installed `github/gh-stack` extension (`init` / `add` / `submit`
  / `sync`) rather than hand-rolling bases with `gh pr create --base`; `sync`
  restacks when a lower PR merges, the step most easily forgotten by hand. A
  stacked PR targets its predecessor, so intermediate states never land on
  `main` — which relaxes "must merge green alone" **for every PR except the
  bottom one**.

  **The bottom PR decides whether the stack is viable.** It targets `main` and
  inherits its ruleset in full, so a first layer that cannot compile alone
  leaves the whole stack permanently `BLOCKED`. A rename-plus-consumers change
  is stackable only if restructured expand/contract (add the new field, migrate
  consumers above it, delete the old field last); otherwise it stays one PR.
  Full mechanics — required-check triggers, collapsing a stack:
  `stacked-prs.md` (beside this file).

## Cloud sessions never write the project board

**Cloud sessions never write the project board — they leave evidence it can be
inferred from.** Projects v2 is GraphQL-only, and cloud sessions have no `gh`
and that API blocked, so never attempt `gh project item-edit` or an equivalent.
Signal status the way the board tooling reads it (`board-keeper.md` Step 3):

- **Starting:** comment on the issue ("starting work in a cloud session"), then
  rename the branch before the first push. A web/remote session starts on a
  generated name like `claude/optimistic-noether-isuljn` or
  `claude/issue-<n>-<id>`; rename it with
  `git branch -m "$(pnpm -s branch:name <n> "<issue title>")"`, which the
  `SessionStart` hook prints when the branch is off the pattern. A pushed
  branch with that name is the In Progress signal. Creating a branch under any
  other name is refused at push and fails the PR's `branch-name` check; a
  branch already on the remote keeps pushing.
- **In review:** open the PR as a draft with the issue reference
  (`Closes #n` on the completing PR only) — an open PR, draft or not, is the
  Code Review signal, and the owner marks it ready at final review. On the
  `@claude` path, `claude.yml`'s `--append-system-prompt` tells every run to
  push and open its own draft PR via `gh pr create --draft`; if a "Create PR"
  link appears instead, `gh pr create --draft --head <branch>` opens one from
  the pushed branch without a checkout.
- **Done:** the merged `Closes #n` PR is the Done signal; nothing extra.

**The board updates itself from that evidence:**
`.github/workflows/board-auto-sync.yml` moves issue `#n` to In Progress when a
branch named for it is pushed and to Code Review when its PR opens. A cloud
session reports the evidence it left and stops — never telling the user the
board waits on a local `board-keeper` run, which only catches up what the
workflow can't see (such as a generated branch name).

## Deployment

**TEMPORARY (2026-09-04) — automatic deployments are OFF.** Nothing deploys on
merge: `deploy-development.yml`'s `push: branches: [main]` trigger is commented
out, and both Storybook projects carry `git.deploymentEnabled: false` (root
`vercel.json` and `packages/ui/vercel.json`). It is a cost freeze on the Vercel
metered-usage allowance, not a permanent change — restoring it is tracked in
#2648. Until then:

- **Don't report a merged PR as deployed, and don't treat a stale dev site as a
  bug.** The dev environment lags `main` until someone dispatches a deploy.
- **A merged Sanity or Drizzle migration is NOT live on dev** — the `migrate`
  and `migrate-db` jobs ride in `deploy-development.yml`, so they wait for the
  manual dispatch too.
- **Deploying is still human-gated and still a push-class action.** The manual
  trigger is `gh workflow run deploy-development.yml` (or the Actions tab) for
  the apps, and the Vercel dashboard's **Redeploy** button for either
  Storybook. Ask before running any of them; never run `vercel` deploy
  commands directly (`CLAUDE.md` "Don't").

Rationale, the per-surface table and the re-enabling procedure:
`docs/context/ci-automation.md` § "Deployments are temporarily manual". **When
re-enabling, uncomment the trigger — never leave it active behind an `if:`
guard**, which corrupts the workflow's change-detection anchor and silently
drops commits.

Normally, deploys are automated by the pipeline (`docs/DEPLOY.md`, `SPEC.md`
§13): merge to `main` → **development**; push a `vX.Y.Z` git tag →
**production** (gated by a CI `verify` job). Dev deploys only the app(s) whose
turbo graph the merge touched (`turbo-ignore`); a production tag always deploys
both. The one-time environment setup (datasets, tokens, Vercel projects, GitHub
secrets, webhooks, CORS) is human-gated console work in `docs/DEPLOY.md`.
Cutting a release is `git tag vX.Y.Z && git push origin vX.Y.Z` — a push, so it
stays under the push gate.
