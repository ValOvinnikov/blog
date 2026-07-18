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

Commit → push → PR are three separate gates, each requiring explicit user
approval. Never bundle them. See `open-pull-request` skill for the full sequence.

## 0. Decide the shape

- Trivial / single-file / one layer → just do it (still test + review).
- Spans multiple layers → use the `add-content-type` recipe and delegate per
  layer as below.
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
- **If locating them means a broad sweep** — "where does X live", "how does Y
  work", "is there already a Z" — dispatch the **`explore` subagent**
  (`.claude/agents/explore.md`) instead of reading around yourself. It answers
  from a cheap, disposable Haiku context and returns conclusions plus
  `file:line` pointers, so the rediscovery never enters this session's window.
  **Grep/Glob-driven discovery belongs to `explore`, not the orchestrator —**
  only `Read` a file directly here once you already know it's the one you need
  (e.g. `explore` pointed at it, or the issue/prior step named it).
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

| Layer / work                                                 | Agent     | Skill it should apply                                       |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------- |
| Constants, `routes`, shared types, `configs/*`, alias wiring | `config`  | —                                                           |
| Sanity schema + `pnpm typegen`                               | `cms`     | `cms-schema-practices`                                      |
| GROQ + typed fetcher                                         | `service` | `add-content-type`, `testing-practices`                     |
| Components                                                   | `ui`      | `ui-library-practices`, `ui-storybook`, `testing-practices` |
| Routes / metadata / feeds                                    | `web`     | `seo-and-metadata`, `web-storybook`, `testing-practices`    |

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

- Dispatch the **`test-writer` subagent** (`.claude/agents/test-writer.md`)
  once the layer agents have finished implementing. Give it the same
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

## 5. Verify

Dispatch the **`verify-runner` subagent** (`.claude/agents/verify-runner.md`)
to run the integration verify pass instead of running it inline yourself —
`turbo run type-check`/`lint`/`test`/`build` output across up to 11 packages
is purely mechanical (a compiler/test runner either succeeds or fails; no
interpretation is needed to know which), so it belongs in the subagent's
disposable Haiku context, not this session's. **Dispatch it synchronously
(`run_in_background: false`), not in the background** — verify is a blocking
prerequisite before `reviewer` can run in step 6, so there is no other queued
work to do while waiting on it (unlike `ci-watcher`, which does have other
work to fill the wait). Give it the exact ordered command sequence for the
scenario at hand; it does not decide or guess scope.

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
   - `pnpm --filter web build` — Next.js build catches RSC errors, missing env
     vars, and bundle issues that type-check alone won't surface. Only `web`
     needs this; `cms`, `service`, and `ui` have no build script.

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
- **If the diff touches `packages/ui` or `apps/web` components**, also dispatch
  the **`a11y-reviewer` subagent** (`.claude/agents/a11y-reviewer.md`) over the
  same diff — it checks the `ui-library-practices` accessibility rules
  (`ariaLabel` prop convention, no in-component date formatting, real heading
  tags, polymorphic `linkAs`, `alt` text, `focus-visible`, icon labelling) that
  `reviewer`'s general pass does not specifically enumerate. Skip it entirely
  for diffs with no `ui`/`web` files.
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
  you proceed to step 7 and ask to commit — a pass from `a11y-reviewer` or
  `seo-auditor` does not excuse a `NEEDS FIXES`/blocking result from any other
  dispatched reviewer, or vice versa. A review that
  never ran is a blocking finding in itself — "the diff is small" or "checks
  are green" does not substitute for the review.

## 7. Hand off to the gate sequence

- Follow Gates 2–5a in `open-pull-request` exactly:
  - Gate 2: ask to commit (or wait for review)
  - Gate 3: ask to push (separate, explicit approval)
  - Gate 4: ask to create the PR (separate, explicit approval)
  - Gate 5: set status → Code Review immediately after PR is created
  - Gate 5a: dispatch `ci-watcher` (background) to watch CI to completion,
    then diagnose and fix any failure it reports — see `open-pull-request`
    for the full mechanics (any resulting push still needs its own fresh
    Gate 3 approval)
- **Then dispatch `board-keeper`** (`.claude/agents/board-keeper.md`) — no
  approval needed, it's not a gate. It re-queries the status write Gate 5 just
  made to confirm it actually stuck (`gh project item-edit` has silently
  failed before) and sweeps the rest of the board for unrelated drift while
  it's there. Dispatch it again after this PR merges, and any time you're
  asked to "reconcile the board."

## 8. Remove the subagent worktrees you created

Once the PR is open, each subagent's worktree has served its purpose — its
commits are landed on the `feat/` branch and pushed. Remove it: nothing else
will. The harness only auto-sweeps worktrees that have **no uncommitted
changes, no untracked files, and no unpushed commits** — and a
`worktree-agent-*` branch is never pushed under its own name, so these
accumulate forever otherwise (26 once piled up). Worktrees created since
issue #410 share the main checkout's `node_modules` (~80 MB each instead of
~1.2 GB — see README §"Working with Claude Code"), but they still clutter
`git worktree list` and hold branches. A subagent cannot do this itself — it
cannot remove the worktree it is standing in.

For each worktree created for this task:

```bash
branch=$(git -C <worktree> branch --show-current)
git -C <worktree> status --porcelain              # must be EMPTY
git cherry origin/<feat-branch> "$branch"         # must print no '+' lines
git worktree remove <worktree>                    # never --force
```

- **Both checks must pass**, and only then remove.
- **Compare against the pushed `feat/` branch — NOT `origin/main`.** At this
  point the PR is open but unmerged, so the agent's commits are on `feat/…`,
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
  half-deleted worktree that then needs `--force`. Shared-deps worktrees
  (root `node_modules` is a symlink) remove in seconds.
- If a worktree still exists after its PR merged, the same checks work against
  `origin/main`.

## 9. Deploy — human-gated, never automatic

- `sanity deploy` (cms) and Vercel deploys are **manual, human-run** steps. Do
  not run them. At most, remind the user of the commands (README → Deployment).

## Guardrails

- Respect every layer boundary (`SPEC.md`). A cross-layer feature that leaks a
  boundary is wrong even if it "works".
- Regenerate + commit the generated types in
  `packages/config/src/sanity/generated/` after schema changes.
- Don't read or commit `.env*`.
