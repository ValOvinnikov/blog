---
name: develop-feature
description: >-
  The end-to-end development lifecycle for this repo — how to take a task from
  request to commit: investigate, plan, delegate each layer to its scoped
  subagent, test, self-review, and commit (deploy is human-gated). Use at the
  START of any non-trivial implementation request so the right agents and skills
  run in the right order.
---

# Develop a feature (lifecycle + delegation)

This is the orchestration playbook. The per-layer agents and the other skills
know _how_ to do their part; this skill says _what order_ and _who does which
part_. Run it at the start of any non-trivial task.

## IMPORTANT: every issue follows the strict gate sequence in `open-pull-request`

Committing is free (no approval needed); push and PR are two separate gates,
each requiring explicit user approval. Never bundle them. See
`open-pull-request` skill for the full sequence.

## 0. Decide the shape

- Trivial / single-file / one layer → just do it (still test + review).
- Spans multiple layers → use the `add-content-type` recipe and delegate per
  layer as below.
- **Filing a new issue for a feature that spans 2+ layers → file an epic
  (parent) plus one sub-issue per layer, never a single flat issue.** This is
  step 0's own "prefer one PR per layer" rule one level earlier: ticket
  structure informs PR structure. See `CLAUDE.md`'s "Never call
  `gh issue create` directly" section for the exact dispatch mechanics
  (batch-create the epic first, then each sub-issue with `parent=<epic-number>`, one
  `board-keeper` dispatch). Working an _existing_ issue that already spans
  layers doesn't retroactively need this — it only applies when you're the one
  filing the ticket.
- **Prefer one PR per layer** (`config → cms → service → ui → web` when config
  changes are involved, otherwise `cms → service → ui → web`; dependency
  order) so each review stays small — **but split only when each layer merges
  to `main` green on its own** (typically additive changes). Keep a single PR
  when a partial merge would break the build: e.g. renaming a shared `_type`
  or generated type that downstream consumes reds `type-check` until every
  layer lands. Split only if possible.

## 1. Investigate + set status (main session)

- **Fetch the GitHub issue** with `gh issue view <number>` to get the full body
  and acceptance criteria — don't rely solely on what the user said in the prompt.
- Restate the task and acceptance criteria. Read `SPEC.md` for the contracts.
- Locate the affected files/layers. Identify which workspaces change:
  `config` (`packages/config`, `packages/utils`, `configs/*`), `cms`,
  `service`, `ui`, `web`.
- **`explore` vs. inline `Bash`/`Read` — decide by whether the target path is
  already known, not by query count.** Dispatch the **`explore` subagent**
  (`.claude/agents/explore.md`) whenever you're searching for something
  ("where does X live", "how does Y work", "is there already a Z", "what else
  references this") — even a single `grep` across a package is unbounded
  discovery if you don't already know which file has the answer. It answers
  from a cheap, disposable Haiku context and returns conclusions plus
  `file:line` pointers, so the rediscovery never enters this session's window.
  Read or grep inline only to verify a specific, already-named file (named by
  the user, the issue body, a prior `explore` dispatch, or this step's own
  prior output).
  **"I already have context from a prior session" is not an exemption** —
  cached memory can be stale (`feedback_memory_staleness_check.md`) and
  doesn't change whether what you're about to run is a _verification_ of a
  known file or a _search_ for an unknown one. If you catch yourself
  justifying an inline `grep`/`find`/`Read` as "narrow" because you already
  suspect where the answer is, that suspicion is exactly the hypothesis
  `explore` should confirm — dispatch it, feeding it your suspected path(s)
  as a starting hypothesis rather than checking them yourself.
- If the task touches a library API, CLI command, or config format you are not
  certain of, run the `use-context7` skill **before** writing the plan — fetch
  the relevant docs now, not mid-implementation.
- **Migration check (schema changes).** If the work alters an _existing_ content
  shape — renaming/removing/moving a field, renaming a `_type`, restructuring a
  document — existing `production` documents will be orphaned unless migrated.
  Decide now whether a data migration is required. If yes, it is part of the plan
  (see step 2); if the change is purely additive/optional, note explicitly that
  no migration is needed. Purely new types/fields need none.
- Surface unknowns early; ask the user only if a decision is genuinely theirs.
- **Follow Gate 0 in `open-pull-request`** — pull the issue from the board,
  set status → In Progress, checkout a new branch from `main`. For multi-layer
  work, run the `superpowers:using-git-worktrees` skill to set up an isolated
  worktree before delegating.

## 2. Plan (main session)

- For any feature that adds new behaviour or touches more than one layer, run
  `superpowers:brainstorming` **before** writing the plan — explore intent,
  constraints, and design decisions first.
- Write the change as ordered steps **in dependency order**:
  `config → cms → types(typegen) → service → ui → web` (drop `config` if it
  has no changes). Never reverse it.
- Explicitly mark which layers are **unaffected** — those agents are skipped
  entirely. Do not invoke an agent whose layer has no changes.
- Note which step each subagent owns.
- **If the investigation flagged a migration**, the plan must include it as an
  explicit step — which documents/fields change, the `sanity/migrate` transform,
  and the dry-run → backup → human-gated run sequence — and **prompt the user
  with that migration plan** before implementing (the live-data change is theirs
  to approve, like a deploy). Follow `apps/cms/migrations/README.md`. Sequence it
  right after the schema+typegen step and before the `service` layer consumes the
  new shape.

## 3. Implement — delegate to the scoped subagent for each layer

Hand each layer's work to its agent (use the Agent tool, or state which agent
owns it). Do them in dependency order; later steps depend on earlier output.
**Skip any agent whose layer has no changes** — don't invoke it at all.

**Land each agent's commit onto your current local branch before dispatching
the next one.** Every layer agent carries `isolation: worktree`, and
`worktree.baseRef: "head"` in `.claude/settings.json` means the _next_
dispatched agent's worktree branches from _your_ local `HEAD` — so it only
sees a prior agent's work once that commit is actually on your branch:
`git merge --ff-only <sha>` when the next agent branches from the same tip,
`git cherry-pick <sha>` if `HEAD` has moved since (parallel agents, an
intervening `pnpm typegen` commit). See `docs/context/claude-code.md`'s
"Sequential agent worktrees compose" note for the full mechanism, and step 4
below for why this discipline matters just as much before dispatching
`test-writer`.

| Layer / work                                                 | Agent       | Skill it should apply                                                               |
| ------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------- |
| Constants, `routes`, shared types, `configs/*`, alias wiring | `config`    | —                                                                                   |
| Sanity schema + `pnpm typegen`                               | `cms`       | `cms-schema-practices`                                                              |
| GROQ + typed fetcher                                         | `service`   | `add-content-type`, `testing-practices`                                             |
| Drizzle schema, migrations, typed queries                    | `db`        | `testing-practices`                                                                 |
| Shared Auth.js config (providers, adapter, session, cookies) | `auth`      | `testing-practices`                                                                 |
| Components                                                   | `ui`        | `ui-library-practices`, `ui-storybook`, `testing-practices`                         |
| Routes / metadata / feeds                                    | `web`       | `web-component-practices`, `seo-and-metadata`, `web-storybook`, `testing-practices` |
| Admin-panel routes, Server Actions, Base UI forms            | `admin-app` | `testing-practices`                                                                 |
| Structured logging (`createLogger`, log sanitization)        | `insight`   | `testing-practices`                                                                 |

`db`, `auth`, `admin-app`, and `insight` are the rows that are **not** steps in
that chain. `db` and `admin-app` are siblings to `service` and `web`
respectively, `auth` is a thin layer above `db`, `insight` is independent (like
`config`/`utils`), and none of the four consumes Sanity.
`config → db → auth → admin-app` runs in parallel to `cms → service → ui → web`,
not after it. `insight` has no upstream and no downstream in this chain today
— dispatch it standalone when the work is genuinely `packages/insight`'s.

All subagents use **Sonnet** (set in each agent's definition file — do not
override with a different model unless the user explicitly asks).

**Context handoff (critical):** Each subagent starts cold. Every Agent tool
prompt must include:

1. One-sentence summary of the feature / issue number
2. Acceptance criteria from the GitHub issue
3. What the previous layer produced (new type names, exported functions,
   component names) — copy the relevant signatures, not just a description
4. Which specific files to read or create
5. Definition of done for that layer (what "finished" looks like)

If you do a layer yourself instead of delegating, still apply that layer's
agent rules and skill.

## 4. Test

- **Land every layer agent's commit onto your current local branch before
  dispatching `test-writer`** (#1796) — `worktree.baseRef: "head"` in
  `.claude/settings.json` means `test-writer`'s own worktree branches from
  _your_ local `HEAD`, exactly like chaining two layer agents (see
  `docs/context/claude-code.md`'s "Sequential agent worktrees" note). If a
  layer agent's product change still lives only on its own
  `worktree-agent-<id>` branch when `test-writer` is dispatched, its worktree
  won't contain it — the fix is landing the commit first (`git merge --ff-only`
  or `git cherry-pick`, same as step 3), never a manual copy/race into the
  freshly-created worktree.
- Dispatch the **`test-writer` subagent** (`.claude/agents/test-writer.md`)
  once every layer agent's commit is landed. Give it the same
  context-handoff package as step 3 (issue summary, acceptance criteria) plus
  a diff summary and the new exports/components/types each layer agent
  produced — it starts cold like any subagent. It applies `testing-practices`
  per layer and is scoped to `*.test.ts(x)` files only, enforced by a
  `PreToolUse` guard (#396): a test that can't pass without a product-code
  change comes back as a finding for you to route to the owning layer agent,
  never a fix `test-writer` makes itself.
- Tests run once per layer when implementation is complete — not after each
  file.
- New routes/metadata: sanity-check `sitemap`/RSS.
- **Land `test-writer`'s own commit too**, same as any other subagent, before
  moving to step 5.
- **The fail-without-the-fix check (`feedback_test_must_fail_without_the_fix`)
  is the orchestrator's job, not `test-writer`'s** (#1796) — `test-writer`
  cannot make or revert a product-code change under any tool, so it cannot
  perform this check itself. After landing its tests, for each regression
  test written specifically to cover a fix: temporarily back out _only_ the
  product-code file(s) it targets — `git checkout <parent-sha> -- <file>`,
  never the test file (by this point the fix is already committed on your
  local branch per the landing step above, so `git stash` has nothing
  uncommitted to stash and silently no-ops instead of reverting anything) —
  run that one test and confirm it fails, then restore the file
  (`git checkout HEAD -- <file>`) and confirm the suite is green again before
  continuing. Skip this for tests that aren't regression tests for a specific
  fix (new-feature coverage with no "should have failed before" claim doesn't
  need it).

## 5. Verify

Dispatch the **`verify-runner` subagent** (`.claude/agents/verify-runner.md`)
to run the integration verify pass instead of running it inline yourself —
`turbo run type-check`/`lint`/`test` output across up to 11 packages
is purely mechanical (a compiler/test runner either succeeds or fails; no
interpretation is needed to know which), so it belongs in the subagent's
disposable Haiku context, not this session's. **Dispatch it in the background
(`run_in_background: true`), same as every other subagent** — verify is a
blocking prerequisite before `reviewer` can run in step 6, but that ordering
holds regardless: the orchestrator resumes on `verify-runner`'s completion
notification and dispatches `reviewer` then, without sitting blocked and
unable to respond to the user meanwhile. Give it the exact ordered command
sequence for the scenario at hand; it does not decide or guess scope.

**`pnpm typegen` never goes to `verify-runner`.** It mutates
`packages/config/src/sanity/generated/` in place — that is a write, not a
read-only verify step, and `verify-runner`'s `read-only-agent-guard.sh` hook
denies it same as it would for `reviewer`/`explore`/`ci-watcher`. Whenever a
scenario below calls for typegen, run it yourself, inline, in this session
_before_ dispatching `verify-runner` for the remaining checks.

**Single-package task, no schema change** (e.g. service query added, ui component added):

- Dispatch `verify-runner` with: `pnpm --filter <pkg> type-check`,
  `pnpm --filter <pkg> lint`, `pnpm --filter <pkg> test` (stop-on-first-failure).
- All three must pass before moving to self-review.

**CMS-only task (schema changed)**:

1. Run `pnpm typegen` yourself, inline — regenerates the types in
   `packages/config/src/sanity/generated/` from the updated schema. Typegen
   can be non-deterministic — re-run until the diff is minimal.
2. Dispatch `verify-runner` with: `pnpm --filter cms type-check`,
   `pnpm --filter cms lint` (stop-on-first-failure) — verify the studio
   itself is clean.

- No web build needed; downstream packages are unchanged.

**Multi-layer task** (more than one package touched, or schema change with downstream effects):
Each step feeds the next:

1. Run `pnpm typegen` yourself, inline — regenerates the types in
   `packages/config/src/sanity/generated/` from the current schema.
   (`sanity schema extract` overwrites `schema.json` in place, so no manual
   clean is needed first. Typegen can be non-deterministic — re-run until the
   diff is minimal.)
2. Dispatch `verify-runner` with this exact sequence, in order,
   stop-on-first-failure:
   - `pnpm type-check` — checks all packages against the freshly generated types.
   - `pnpm lint` — runs across all packages.
   - `pnpm test` — runs all test suites. Per-package checks already ran during
     implementation; this is the integration pass.

**No local `build` step.** CI's `ci.yml` runs a dedicated `build` job (Next.js
build + Sanity Studio build) gating every PR — a local re-run duplicates it.
Measured cost of adding it to the local loop: +~65% tokens and +~4.6× wall
time on a `verify-runner` dispatch, for a check CI already gates on. If you
need to reproduce an actual CI build failure, run the specific failing
command locally then (`open-pull-request` Gate 5a) — that's targeted
diagnosis, not a routine step.

All checks must pass before moving to self-review. If `verify-runner` reports
a failure, diagnose it yourself (or delegate the fix to the owning layer's
subagent) — `verify-runner` only reports which command failed and the
trimmed output, it never diagnoses or fixes. Fix the failing layer, then
re-dispatch `verify-runner` from the failed step — do not proceed with any
red check.

## 6. Review (blocking — Gate 2 must not be offered until this passes)

- Dispatch the **`reviewer` subagent** (`.claude/agents/reviewer.md`) over the
  full diff (`main...HEAD` + working tree). It applies `code-review-practices`
  — mechanical scan, contract pass, general pass — with fresh eyes and reports
  a verdict.
- **If the diff touches `packages/ui`, `apps/web`, or `apps/admin` components**, also dispatch
  the **`a11y-reviewer` subagent** (`.claude/agents/a11y-reviewer.md`) over the
  same diff — it checks the `ui-library-practices` accessibility rules
  (`ariaLabel` prop convention, no in-component date formatting, real heading
  tags, polymorphic `linkAs`, `alt` text, `focus-visible`, icon labelling) that
  `reviewer`'s general pass does not specifically enumerate. Skip it entirely
  for diffs with no `ui`/`web`/`admin` files.
- **If the diff touches `apps/web` routes, metadata, structured data, or
  feeds** (any of: `generateMetadata`, JSON-LD, `sitemap.ts`, `robots.ts`,
  `rss.xml/route.ts`, or a new/changed route under `apps/web/src/app`), also
  dispatch the **`seo-auditor` subagent** (`.claude/agents/seo-auditor.md`)
  over the same diff, alongside `reviewer` — not instead of it. It applies
  the `seo-and-metadata` skill as an audit checklist and reports a verdict in
  the same `APPROVE` / blocking / non-blocking / not-checked format. A single
  `apps/web` diff can trigger both `a11y-reviewer` and `seo-auditor` at once —
  dispatch whichever of the two conditions match; they check different things
  and neither substitutes for the other.
- Fix every **blocking** finding from any dispatched reviewer (delegating to
  the owning layer agent where appropriate), re-run the affected verify checks
  from step 5, then re-dispatch whichever subagent found the issue until every
  dispatched reviewer returns its pass verdict (`APPROVE` / `PASS`).
- Only after every dispatched reviewer's pass verdict (`APPROVE` / `PASS`) may
  you proceed to step 7 and commit the reviewed work + ask to push — a pass from `a11y-reviewer` or
  `seo-auditor` does not excuse a `NEEDS FIXES`/blocking result from any other
  dispatched reviewer, or vice versa. A review that
  never ran is a blocking finding in itself — "the diff is small" or "checks
  are green" does not substitute for the review.
- **Non-blocking findings don't gate this PR, but don't let them evaporate
  either.** A finding a reviewer correctly judged non-blocking (worth doing,
  not worth delaying this diff for) still represents real, identified work —
  relaying it to the user once in a summary and moving on is not the same as
  tracking it. Real incident: `reviewer` flagged the same DRY-violation
  pattern (near-identical repeated blocks) as non-blocking on #1162's review;
  the orchestrator repeated the finding back to the user in its own summary
  but took no further action, and the user had to independently notice the
  same pattern in a sibling file and ask for it to be ticketed before
  anything happened. For every non-blocking finding you judge genuinely
  worth fixing (not every nitpick — use judgment same as anywhere else),
  **file a follow-up issue via `board-keeper`** (`CLAUDE.md`'s "Never call
  `gh issue create` directly" mechanics apply) before moving on to the next
  step, rather than letting it live only in a chat summary. This applies
  per-finding, not per-review — a review can return one blocking fix plus
  three non-blocking notes, and only some of those three may warrant a
  ticket; file the ones that do, say so for the ones that don't and why.

## 7. Hand off to the gate sequence

- Follow Gates 2–5a in `open-pull-request` exactly:
  - Gate 2: commit the reviewed work (no approval needed)
  - Gate 3: ask to push (separate, explicit approval)
  - Gate 4: ask to create the PR (separate, explicit approval)
  - Gate 5: set status → Code Review immediately after PR is created
  - Gate 5a: dispatch `ci-watcher` (background) to watch CI to completion,
    then diagnose and fix any failure it reports — see `open-pull-request`
    for the full mechanics (any resulting push still needs its own fresh
    Gate 3 approval)
- **Then dispatch `board-keeper`** (`.claude/agents/board-keeper.md`) with a
  targeted `"after PR #<n>"` trigger — no approval needed, it's not a gate.
  It re-queries the status write Gate 5 just made to confirm it actually
  stuck (`gh project item-edit` has silently failed before). This is a cheap,
  single-issue check by default now — it does not sweep the rest of the
  board unless you append "...also reconcile the board" or dispatch it bare
  for a full sweep. Dispatch it again (targeted `"after merge of #<n>"`)
  after this PR merges, and run a full sweep any time you're asked to
  "reconcile the board" or a targeted check surfaces something that looks
  broader than the one issue.

## 8. Remove the subagent worktrees you created

**When: as soon as the worktree's commits exist on the remote.** That is the
whole safety condition — `git cherry origin/<feat-branch>` passing _is_ the
proof the push landed, and a pushed branch stays recoverable whatever happens
to the local directory. So the trigger is the **push (Gate 6)**, not the PR;
opening the PR adds nothing a removal was waiting for. (Same anchor the
scratchpad buffers below use, for the same reason.)

Two kinds of worktree, two timings:

- **Layer-agent worktrees (`agent-<id>`)** — removable once the agent's patch
  is captured and landed on the `feat/` branch, which happens when its
  completion notification arrives, well before the push. Waiting longer buys
  nothing: the worktree already holds no unique work. Do not remove one while
  its agent may still be resumed via `SendMessage` — harness teardown of an
  idle agent preserves the work and recreates it on resume, but
  `git worktree remove` is permanent.
- **The session's own feature worktree** (`EnterWorktree`-created, holding the
  `feat/` branch itself) — safe from the push onward, but **keep it until CI is
  green**. A Gate 5a CI fix is made on that branch; removing it at push just
  means re-creating a worktree to make the fix in.

Remove them: nothing else
will. The harness only auto-sweeps worktrees that have **no uncommitted
changes, no untracked files, and no unpushed commits** — and a
`worktree-agent-*` branch is never pushed under its own name, so these
accumulate forever otherwise (26 once piled up). Worktrees created since
issue #410 share the main checkout's `node_modules` (~80 MB each instead of
~1.2 GB — see `docs/context/claude-code.md`), but they still clutter
`git worktree list` and hold branches. A subagent cannot do this itself — it
cannot remove the worktree it is standing in.

### Only your own worktrees — never enumerate `git worktree list`

**This machine runs several Claude sessions at once, each with its own
worktrees, all under the same `.claude/worktrees/`.** `git worktree list`
therefore shows other jobs' live worktrees alongside yours. Cleaning up means
removing **the worktrees this session created** — not everything that happens
to be listed. Build the removal list from your own dispatch record (note each
worktree path as you create/dispatch it), never by looping over
`git worktree list` output.

Then, before touching any path on that list, confirm it is still yours:

```bash
name=$(basename <worktree>)
lock=$(git rev-parse --git-common-dir)/worktrees/$name/locked
[ -f "$lock" ] && { echo "OWNED BY: $(cat "$lock")"; }   # -> skip, not yours
```

The harness locks every worktree it materializes for a live session or agent,
with a reason naming the owner and its pid — `claude session
fix-1788-storybook-fonts (pid 76582 start …)` / `claude agent
agent-a6bad5fd611dd5df6 (pid …)`. A lock file present means **some process
still owns that worktree**: another parallel job, or one of your own subagents
that has not finished. Skip it and move on.

Attempting removal anyway gives you:

```
fatal: cannot remove a locked working tree, lock reason: claude session … (pid …)
use 'remove -f -f' to override or unlock first
```

**That message is the guard working, not an obstacle to route around.** Do not
run `git worktree remove -f -f`, do not `git worktree unlock` a worktree you do
not own, and do not retry it later in the same session. Forcing it deletes a
live session's working directory out from under it — that is exactly how #669's
config agent lost its uncommitted work to a broad sweep. A locked worktree that
is not yours needs no action from you at all: its owner removes it when that job
ends.

A bare `git worktree prune` is safe (it only drops metadata for directories that
are already gone) — a `for` loop over `git worktree list` is not.

For each worktree **you created for this task**, and that the ownership check
above cleared:

```bash
git fetch origin                                  # stale refs answer the wrong question
branch=$(git -C <worktree> branch --show-current)
git -C <worktree> status --porcelain              # must be EMPTY
git cherry origin/<feat-branch> "$branch"         # must print no '+' lines
git worktree remove <worktree>                    # never --force
```

- **All three checks must pass** — unlocked, clean, landed — and only then
  remove.
- **`git fetch origin` first, every time.** Both the `git cherry` check and the
  post-merge check below read a remote-tracking ref; against a stale one they
  answer the wrong question.
- **Compare against the pushed `feat/` branch — NOT `origin/main`.** At this
  point the branch is pushed but unmerged, so the commits are on `feat/…`,
  not yet on `main`; checking `origin/main` reports every commit as unmerged
  and you would never clean anything up. Using `origin/<feat-branch>` also
  proves the work reached the remote, which is what makes deleting the local
  worktree safe.
- **Use `git cherry`, not `git rev-list --count`.** rev-list counts SHAs, so a
  squash- or rebase-merged branch still looks "ahead" and you would keep a
  worktree whose work is fully landed.
- Uncommitted changes exist nowhere else and are unrecoverable — if `status` is
  dirty, leave the worktree and tell the user what is in it.
- Removal keeps the branch — committed work stays recoverable, which is what
  makes this safe.
- Worktrees created before the shared-`node_modules` change (issue #410) hold
  a private ~1.1 GB `node_modules`, so their deletion is slow — remove them
  one at a time with a generous timeout; an interrupted removal leaves a
  half-deleted worktree that then needs `--force` — the one legitimate use of
  that flag, on a worktree you own that you were already mid-way through
  removing, and still never `-f -f` on a locked one. Shared-deps worktrees
  (root `node_modules` is a symlink) remove in seconds.
- **Leftovers from earlier sessions are not yours to sweep on your own
  initiative.** Unlocked `agent-*` worktrees with no live owner do accumulate,
  but clearing them is a separate, explicitly requested cleanup — not part of
  this gate. When asked to do it, apply the same three checks to each one
  individually, and still skip every locked path.

### After the PR merged

A worktree that outlived its PR takes the same three checks, comparing against
`origin/main` — GitHub deletes the `feat/` branch on merge, so
`origin/<feat-branch>` no longer resolves.

- **A "removing will discard N commits" refusal is usually false.** The
  `ExitWorktree`/cleanup guard counts commits against your **local** `main`,
  and local `main` does not move when a PR merges on GitHub — so every branch
  you ever merged still looks unmerged, and N grows with each merge. Do not
  take the number at face value, and do not reflexively answer it with
  `discard_changes: true`. Settle it with the authoritative test:

  ```bash
  git fetch origin
  git merge-base --is-ancestor <branch> origin/main && echo MERGED || echo NOT-MERGED
  ```

  `MERGED` means the commits are in `origin/main` and discarding loses nothing.
  `NOT-MERGED` means the guard is right — keep the worktree and tell the user
  what is in it. (Seen on `fix/1788-storybook-fonts`: the guard claimed 22
  commits at risk; the branch was an ancestor of `origin/main` with zero
  unique commits.)

- **Fix the cause, not just the symptom.** The refusal recurs after every merge
  until local `main` is synced. Fast-forward it once the working tree is clean
  — `git merge --ff-only origin/main` — and the guard stops firing on
  already-merged branches.

### Remove the scratchpad transfer buffers too

The `.claude/scratchpad*/` directory an agent exported its diff into is a
**transfer buffer**, not a record. Once the assembled work is committed and
pushed, git holds it and the copy is pure duplication — delete it in the same
pass as the worktrees, and for the same reason.

**Do not delete it before the push.** Between an agent finishing and its work
reaching the remote, that export can be the only surviving copy: idle agent
worktrees get torn down, taking their uncommitted files with them. Push is the
line that makes the copy redundant.

**Delete the exact paths you created — never a wildcard.** Parallel jobs share
`.claude/scratchpad*/` the same way they share `.claude/worktrees/`, but with
one critical difference: **a scratchpad has no lock file**. Nothing refuses the
operation, nothing prints a `fatal:` — `rm -rf .claude/scratchpads/*` silently
destroys another running job's in-flight transfer buffer, and the first sign of
trouble is that job's assembly step finding an empty directory. The issue-keyed
names are not sufficient ownership either: the same issue accumulates variants
across sessions (`1786/` and `1786-tests/`, `1754-focus-lock/`,
`1754-focus-conditional/`, `1754-focus-final/`), so even
`rm -rf .claude/scratchpads/1786*` can reach outside your own work. Remove the
specific directories from your dispatch record, one at a time.

Leftovers from earlier sessions are the same story as orphan worktrees — real,
but somebody else's to authorize. They are cheap (the whole tree was ~1 MB
across 10 directories when this was written), so clearing them is a separate
explicitly-requested cleanup, and one that has to confirm no live job is still
writing to a directory before touching it.

## 9. Deploy — human-gated, never automatic

- `sanity deploy` (cms) and Vercel deploys are **manual, human-run** steps. Do
  not run them. At most, remind the user of the commands (`docs/DEPLOY.md`).

## Guardrails

- Respect every layer boundary (`SPEC.md`). A cross-layer feature that leaks a
  boundary is wrong even if it "works".
- Regenerate + commit the generated types in
  `packages/config/src/sanity/generated/` after schema changes.
- Don't read or commit `.env*`.
