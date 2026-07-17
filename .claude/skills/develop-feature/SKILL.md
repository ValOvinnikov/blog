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
- **Prefer one PR per layer** (`cms → service → ui → web`, dependency order) so
  each review stays small — **but split only when each layer merges to `main`
  green on its own** (typically additive changes). Keep a single PR when a
  partial merge would break the build: e.g. renaming a shared `_type` or
  generated type that downstream consumes reds `type-check` until every layer
  lands. Split only if possible.

## 1. Investigate + set status (main session)

- **Fetch the GitHub issue** with `gh issue view <number>` to get the full body
  and acceptance criteria — don't rely solely on what the user said in the prompt.
- Restate the task and acceptance criteria. Read `SPEC.md` for the contracts.
- Locate the affected files/layers (Grep/Glob/Read). Identify which workspaces
  change: `cms`, `service`, `ui`, `web`.
- **If locating them means a broad sweep** — "where does X live", "how does Y
  work", "is there already a Z" — dispatch the **`explore` subagent**
  (`.claude/agents/explore.md`) instead of reading around yourself. It answers
  from a cheap, disposable Haiku context and returns conclusions plus
  `file:line` pointers, so the rediscovery never enters this session's window.
  Read directly when you already know the file.
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
  `cms → types(typegen) → service → ui → web`. Never reverse it.
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

| Layer / work                   | Agent     | Skill it should apply                                       |
| ------------------------------ | --------- | ----------------------------------------------------------- |
| Sanity schema + `pnpm typegen` | `cms`     | `cms-schema-practices`                                      |
| GROQ + typed fetcher           | `service` | `add-content-type`, `testing-practices`                     |
| Components                     | `ui`      | `ui-library-practices`, `ui-storybook`, `testing-practices` |
| Routes / metadata / feeds      | `web`     | `seo-and-metadata`, `web-storybook`, `testing-practices`    |

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

- Follow the `testing-practices` skill. Tests run once per layer when
  implementation is complete — not after each file.
- New routes/metadata: sanity-check `sitemap`/RSS.

## 5. Verify

**Single-package task, no schema change** (e.g. service query added, ui component added):

- Run per-package checks only: `pnpm --filter <pkg> type-check`,
  `pnpm --filter <pkg> lint`, `pnpm --filter <pkg> test`.
- All three must pass before moving to self-review.

**CMS-only task (schema changed)**:

1. `pnpm typegen` — regenerates the types in
   `packages/config/src/sanity/generated/` from the updated schema.
2. `pnpm --filter cms type-check` and `pnpm --filter cms lint` — verify the
   studio itself is clean.

- No web build needed; downstream packages are unchanged.

**Multi-layer task** (more than one package touched, or schema change with downstream effects):
Run in this exact order from the repo root — each step feeds the next:

1. `pnpm typegen` — regenerates the types in
   `packages/config/src/sanity/generated/` from the current schema.
   (`sanity schema extract` overwrites `schema.json` in place, so no manual
   clean is needed first. Typegen can be non-deterministic — re-run until the
   diff is minimal.)
2. `pnpm type-check` — checks all packages against the freshly generated types.
3. `pnpm lint` — runs across all packages.
4. `pnpm test` — runs all test suites. Per-package checks already ran during
   implementation; this is the integration pass.
5. `pnpm --filter web build` — Next.js build catches RSC errors, missing env
   vars, and bundle issues that type-check alone won't surface. Only `web`
   needs this; `cms`, `service`, and `ui` have no build script.

All checks must pass before moving to self-review. Fix the failing layer and
re-run from that step — do not proceed with any red check.

## 6. Review (blocking — Gate 2 must not be offered until this passes)

- Dispatch the **`reviewer` subagent** (`.claude/agents/reviewer.md`) over the
  full diff (`main...HEAD` + working tree). It applies `code-review-practices`
  — mechanical scan, contract pass, general pass — with fresh eyes and reports
  a verdict.
- **If the diff touches `apps/web` routes, metadata, structured data, or
  feeds** (any of: `generateMetadata`, JSON-LD, `sitemap.ts`, `robots.ts`,
  `rss.xml/route.ts`, or a new/changed route under `apps/web/src/app`), also
  dispatch the **`seo-auditor` subagent** (`.claude/agents/seo-auditor.md`)
  over the same diff, alongside `reviewer` — not instead of it. It applies
  the `seo-and-metadata` skill as an audit checklist and reports a verdict in
  the same `APPROVE` / blocking / non-blocking / not-checked format.
- Fix every **blocking** finding from either subagent (delegating to the
  owning layer agent where appropriate), re-run the affected verify checks
  from step 5, then re-dispatch whichever subagent found the issue until it
  returns `APPROVE`.
- Only after `APPROVE` from `reviewer` (and from `seo-auditor` when
  dispatched) may you proceed to step 7 and ask to commit. A review that
  never ran is a blocking finding in itself — "the diff is small" or "checks
  are green" does not substitute for the review.

## 7. Hand off to the gate sequence

- Follow Gates 2–5 in `open-pull-request` exactly:
  - Gate 2: ask to commit (or wait for review)
  - Gate 3: ask to push (separate, explicit approval)
  - Gate 4: ask to create the PR (separate, explicit approval)
  - Gate 5: set status → Code Review immediately after PR is created

## 8. Remove the subagent worktrees you created

Once the PR is open, each subagent's worktree has served its purpose — its
commits are landed on the `feat/` branch and pushed. Remove it: nothing else
will. The harness only auto-sweeps worktrees that have **no uncommitted
changes, no untracked files, and no unpushed commits** — and a
`worktree-agent-*` branch is never pushed under its own name, so these
accumulate forever otherwise (~1.1 GB each; 26 once piled up). A subagent
cannot do this itself — it cannot remove the worktree it is standing in.

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
- Deletion is slow (~1.1 GB of `node_modules` each). Remove them one at a time
  with a generous timeout; an interrupted removal leaves a half-deleted
  worktree that then needs `--force`.
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
