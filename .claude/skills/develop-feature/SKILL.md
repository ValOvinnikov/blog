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

The orchestration playbook: what order things happen in and who does each part.
The layer agents and the other skills know _how_; `CLAUDE.md` holds the rules
this points at. Every issue then follows the gate sequence in
`open-pull-request` — committing is free; push and PR are two separate
approvals, never bundled.

## 0. Decide the shape

- Trivial / single-file / one layer → dispatch that layer's agent directly,
  skipping the multi-layer recipe (still test + review).
- Spans multiple layers → use the `add-content-type` recipe and delegate per
  layer as below.
- Filing a ticket for a 2+-layer feature → an epic plus one sub-issue per
  layer, created in one `board-keeper` dispatch (→ `CLAUDE.md` "A feature
  spanning 2+ layers always gets an epic" for the rule, "Never call
  `gh issue create` directly" for the dispatch). An existing multi-layer issue
  is not re-filed.
- One PR per layer, merged one at a time (→ `CLAUDE.md` "Planning work —
  mandatory, not advisory"): steps 1–8 run to completion for one layer, then
  start again on a branch cut from the `main` that now holds it. Combine
  layers only when splitting would red `main`; stack only when the user says
  to.

## 1. Investigate + set status (main session)

- **`gh issue view <n>`** for the full body and acceptance criteria — don't
  rely on the prompt alone.
- Restate the task and criteria. Read `SPEC.md` for the contracts, and the
  feature's page under `docs/features/` when one exists.
- Identify which workspaces change.
- **`explore` vs. inline `Bash`/`Read` — decide by whether the target path is
  already known, not by query count.** Searching ("where does X live", "is
  there already a Z", "what references this") → dispatch `explore`
  (`.claude/agents/explore.md`): it works in a disposable Haiku context and
  returns conclusions plus `file:line`, so the rediscovery never enters this
  window. Read or grep inline only to verify a file already named by the user,
  the issue, a prior `explore` or this step. Prior-session context is no
  exemption — memory goes stale — and a suspicion about where the answer lives
  is the hypothesis to hand `explore`, not to check yourself.
- **Ask `explore` for the nearest existing sibling** — the schema, loader,
  component, view or migration most like what is being built — as a path plus
  one line on how it differs. It goes into every layer brief (step 3, item 6);
  an agent briefed without one re-invents the shape and clones code.
- Uncertain of a library API, CLI flag or config format → run `use-context7`
  now, before the plan.
- **Migration check** → `CLAUDE.md` "Check for migrations" and "Check for `db`
  (Neon/Drizzle) migrations too". Decide now; when the change is purely
  additive, say explicitly that no migration is needed.
- **Voice check** → list every public-site string the work adds or rewords,
  including the copy a new `@blog/ui` text prop will carry once `web` wires
  it, each with a recommended classification (`CLAUDE.md` "Check for Voice
  candidates"). This is the plan's **Copy** line.
- **Manual-test check** → if the change alters what a page shows or how it
  behaves, the plan carries a manual-test issue (step 2).
- **Cost check** → list every new or changed cron, Workflow run, paid API
  call, Blob/KV use and hot-path query with its expected volume and whether
  it stays inside the free allowances, or "none". This is the plan's
  **Cost** line (`CLAUDE.md` "Say what it touches before starting").
- Surface unknowns early; ask only when a decision is genuinely the user's.
- **Follow Gate 0 in `open-pull-request`** — board → In Progress, the branch,
  and its exception for worktree-delegated work. For multi-layer work, run
  `superpowers:using-git-worktrees` before delegating.

## 2. Plan (main session)

- New behaviour or more than one layer → run `superpowers:brainstorming`
  before writing the plan.
- Order the steps by dependency and never reverse it:
  `config → studio → typegen → service → ui → web`, and
  `config → db → auth → platform-app` on the platform side. Drop the layers
  that don't change.
- Mark the unaffected layers; their agents are not invoked. Note which agent
  owns each step.
- **Put the split to the user before the first dispatch**, carrying every
  line `CLAUDE.md` "Say what it touches before starting" requires. Once they
  approve it:
  - write the settled Copy classifications into the ticket body, and name
    each key's list (`VOICE_FIELDS` or `VOICE_FIXED_KEYS`) in the dispatch
    prompt;
  - a string an agent reports under **Voice candidates** that the plan did
    not list goes to the user before commit.
- Each ticket's `## Scope` carries a `Feature doc:` line —
  `update | create | none` (→ `CLAUDE.md` "Feature docs" and the sub-issue
  template in "Issue body template").
- **Migration flagged** → it is an explicit plan step, sequenced right after
  schema + typegen and before `service` consumes the new shape; its plan goes
  to the user before implementing (→ `CLAUDE.md` "Check for migrations").

### Manual-test issue

Any change that alters what a page shows or how it behaves — UI, copy,
routing, validation, interaction, user-visible caching or revalidation —
ships with a manual-test issue.

- **Create it with the implementation tickets**, in the same `board-keeper`
  dispatch: a sub-issue of the epic, or linked from the single ticket.
  Labels: `manual-test` plus the same `prio:*` label as the work.
- **Write the body from the manual-test template** in `CLAUDE.md` "Issue
  body template".
- **The completing PR body links it without a closing keyword** (→
  `open-pull-request` "PR body template"). It closes only after the owner has
  run it.
- **Walk the owner through it one step per message**, waiting for each
  result before sending the next.

## 3. Implement — delegate each layer to its agent

Hand each layer's work to its agent in dependency order, and skip any agent
whose layer has no changes. Every file in an agent's domain — first draft,
review fix and follow-up alike — is written by that agent (→ `CLAUDE.md` "Use
the scoped agents"). When you do a layer yourself (solo-session mode), apply
that agent's rules and skill.

**One layer per pass.** Under the default split this step dispatches only the
layer whose PR is next. Two layers' agents back to back is right only inside
one PR: a supporting package (`config`, `utils`, `db`, …) riding along with
the workspace that needs it, or layers combined because the split would red
`main`.

**A bugfix is TDD, done by the layer agent itself** — the failing regression
test first, then the fix (`superpowers:test-driven-development`). New feature
code carries no self-written tests here; that is `test-writer`'s pass in
step 4.

**Land each agent's commit on your local branch before dispatching the next
agent.** Every layer agent carries `isolation: worktree`, and
`worktree.baseRef: "head"` in `.claude/settings.json` branches the next
worktree from your local `HEAD` — so an agent sees earlier work only once that
commit is on your branch. Use `git merge --ff-only <sha>` from the same tip,
`git cherry-pick <sha>` when `HEAD` has moved (parallel agents, an
intervening typegen commit). Mechanism: `docs/context/claude-code.md`
"Sequential agent worktrees compose".

| Layer / work                                                 | Agent          | Skill it should apply                                                               |
| ------------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------- |
| Constants, `routes`, shared types, `configs/*`, alias wiring | `config`       | `testing-practices`                                                                 |
| Sanity schema                                                | `studio`       | `studio-schema-practices`                                                           |
| GROQ + typed fetcher                                         | `service`      | `add-content-type`, `testing-practices`                                             |
| Drizzle schema, migrations, typed queries                    | `db`           | `testing-practices`                                                                 |
| Shared Auth.js config (providers, adapter, session, cookies) | `auth`         | `testing-practices`                                                                 |
| Components                                                   | `ui`           | `ui-library-practices`, `ui-storybook`, `testing-practices`                         |
| Routes / metadata / feeds                                    | `web`          | `web-component-practices`, `seo-and-metadata`, `web-storybook`, `testing-practices` |
| Admin-panel routes, Server Actions, Base UI forms            | `platform-app` | `platform-ui-practices`, `testing-practices`                                        |
| Structured logging (`createLogger`, log sanitization)        | `insight`      | `testing-practices`                                                                 |
| Email shell, `escapeHtml`, `sendEmail` transport             | `email`        | `testing-practices`                                                                 |

For any React component, `ui`, `web` and `platform-app` apply
`react-component-practices` before their layer skill. `studio` may run
typegen in its worktree to check its schema; the authoritative run is yours,
in §5. `db`, `auth`, `platform-app`, `insight` and `email` are not steps in
the Sanity chain; when each is dispatched is in `CLAUDE.md` "Use the scoped
agents". Each agent's model is set in its definition file — don't override it
unless the user asks.

**Context handoff — every agent starts cold.** Every dispatch prompt includes:

1. A one-sentence summary and the issue number.
2. The acceptance criteria from the issue.
3. What the previous layer produced — copy the signatures (types, functions,
   components), not a description of them.
4. Which files to read or create.
5. The definition of done for this layer.
6. The nearest sibling to model on (step 1), as a path. The agent mirrors its
   structure and naming; copying more than a few lines out of it means a
   shared helper to extract (→ `CLAUDE.md` "Reuse before you create"), and the
   report says so. **State in the brief that the sibling's comments are not
   part of the model** — its doc block is drift to leave behind, or the agent
   writes one more `XModule — fetches module_x` block.

**The docs the PR owes are yours to write**, because `docs/**` and `SPEC.md`
sit outside every agent's scope (→ `CLAUDE.md` "Spec sync" and "Feature
docs"). Write them before step 6 so the reviewer sees them.

## 4. Test

New-feature coverage only — a bugfix's regression test was written first in
step 3, and `test-writer` never touches it.

- **Land every layer agent's commit first**, as in step 3. `test-writer`'s
  worktree branches from your `HEAD`, so a change still only on a
  `worktree-agent-<id>` branch is invisible to it. Never copy files into its
  worktree instead.
- Dispatch **`test-writer`** (`.claude/agents/test-writer.md`) with the step 3
  handoff plus a diff summary and the new exports, components and types each
  layer produced. It applies `testing-practices`, is confined to
  `*.test.ts(x)` by `test-writer-scope-guard.sh`, and returns a test that
  needs a product change as a finding for you to route to the owning agent.
- Tests run once per layer when implementation is complete, not after each
  file.
- New routes or metadata: sanity-check `sitemap` and RSS.
- Land `test-writer`'s commit too before step 5.
- **The fail-without-the-fix check is yours** — `test-writer` cannot revert
  product code. For each regression test covering a specific fix:
  `git checkout <parent-sha> -- <product file>` (never the test file;
  `git stash` silently no-ops because the fix is already committed), run that
  one test and confirm it fails, `git checkout HEAD -- <product file>`, and
  confirm the suite is green. Skip it for new-feature coverage that makes no
  "failed before" claim.

## 5. Verify

**Open with `git fetch origin && git merge origin/main`** (or a rebase onto
it) — a branch verified behind `main` proves nothing about what CI runs. A
merge from `origin/main` after `verify-runner` or `reviewer` ran invalidates
both: re-verify and re-review before the push ask.

1. **Schema changed?** Run `pnpm typegen` yourself, inline — it writes
   `packages/config/src/sanity/generated/`, so `verify-runner`'s
   `read-only-agent-guard.sh` denies it. Re-run until the diff is minimal.
   Skip when no schema file changed.
2. **Dispatch `verify-runner`** (`.claude/agents/verify-runner.md`), in the
   background like every dispatch, with `pnpm verify` as the exact command
   (the chain is in `CLAUDE.md` Conventions). It never chooses scope.
   - **Its first command is `cd <absolute path of the checkout to verify>`,
     and every later command carries the same `cd … &&`** — it is not
     worktree-isolated and otherwise runs wherever its shell starts, which
     has been the stale main checkout.
   - Its report opens with `pwd` and `git rev-parse HEAD`. **Compare that SHA
     with your own `HEAD` before dispatching `reviewer`**; reject and
     re-dispatch on a mismatch, or on a report that names no commit.

There is no per-package or `--filter` variant: Turbo already caches untouched
packages, and scoped runs are how type-check, revalidate-tag, migration-index,
client-graph, turbo-env and UI-index failures reached CI unseen. There is no
local `build` either — reproduce a CI build failure only to diagnose it
(`open-pull-request` Gate 5a).

**A hook or script diff** (`.claude/hooks/**`, `scripts/*.sh`) also runs the
shellcheck and guard-test steps of `.github/workflows/workflow-security.yml`
locally before commit — that file is the source of truth if this list drifts:

```
shellcheck .claude/hooks/*.sh scripts/*.sh
bash .claude/hooks/read-only-agent-guard.test.sh
sh .claude/hooks/gate-bypass-guard.test.sh
sh .claude/hooks/pre-bash-worktree-install-guard.test.sh
sh .claude/hooks/pre-bash-branch-name-guard.test.sh
bash .claude/hooks/test-writer-scope-guard.test.sh
bash .claude/hooks/pre-agent-gate0-guard.test.sh
bash .claude/hooks/post-edit.test.sh
bash .claude/hooks/subagent-stop-commit-guard.test.sh
bash .claude/hooks/layer-scope-guard.test.sh
bash .claude/hooks/board-keeper-graphql-guard.test.sh
sh scripts/vercel-ignore-affected.test.sh
```

Such a diff is not docs-only, so it still gets `reviewer` in step 6.

Every check passes before step 6. `verify-runner` only reports the failing
command and trimmed output; diagnose it yourself or route the fix to the
owning agent, then re-dispatch. Never proceed on red.

## 6. Review (blocking — Gate 2 is not offered until this passes)

**Run `git fetch origin` before dispatching any reviewer** (`reviewer`,
`a11y-reviewer`, `seo-auditor`) — a worktree session's local `main` goes
stale, and the read-only guard denies them `git fetch`. Every prompt names the
base as `origin/main`, never bare `main`, and states the expected file count
(`git diff origin/main...HEAD --name-only | wc -l`, plus dirty working-tree
files) so the reviewer can flag a mismatch.

- **`reviewer`** (`.claude/agents/reviewer.md`) over the full diff
  (`origin/main...HEAD` + working tree); it applies `code-review-practices`.
  A docs-only diff gets the inline identifier check instead (`CLAUDE.md`
  delivery gate step 4).
- **`a11y-reviewer`** as well when the diff touches `packages/ui`, `apps/web`
  or `apps/platform` components.
- **`seo-auditor`** as well when the diff touches `apps/web` routes, metadata,
  structured data or feeds — `generateMetadata`, JSON-LD, `sitemap.ts`,
  `robots.ts`, an `rss.xml/route.ts`, or any new or changed route under
  `apps/web/src/app`. One diff can need both; neither substitutes for
  `reviewer` or for the other.
- **Fix every blocking finding** through the owning agent, re-run step 5, and
  re-dispatch the reviewer that raised it until every dispatched reviewer
  passes (`APPROVE` / `PASS`). One reviewer's pass does not excuse another's
  blocking result. A review that never ran is itself blocking — a small diff
  or green checks do not substitute.
- **Non-blocking findings don't gate the PR, but never leave one only in a
  chat summary.** Each one worth doing is fixed on this branch by the owning
  agent when it is the same layer and small, or else filed through
  `board-keeper` before moving on (→ `CLAUDE.md` "Findings found mid-work get
  fixed in the current work"). Say which ones you are not acting on, and why.

## 7. Hand off to the gate sequence

Follow `open-pull-request` exactly:

- Gate 2: commit the reviewed work (no approval needed).
- Gate 3: ask to push — its own explicit approval.
- Gate 4: ask to open the PR — its own explicit approval. The completing PR's
  body links the manual-test issue without a closing keyword.
- Gate 5: `board-keeper` with `"after PR #<n>"`, synchronously. It sets Code
  Review and is also the "after PR" reconciliation, so don't dispatch it
  twice. Then the job label.
- Gate 5a: `ci-watcher` in the background; diagnose and fix any failure it
  reports. Every fix push needs a fresh Gate 3 approval.

After the PR merges, dispatch `board-keeper` with `"after merge of #<n>"`
(Gate 6; → `CLAUDE.md` "Board reconciliation").

## 8. Remove the subagent worktrees you created

`CLAUDE.md` delivery gate step 8 states the rules — your own dispatch record
only, lock files, an isolated session exiting first, scratchpads by exact
path. This section is the procedure and its checks.

**When:**

- **Layer-agent worktrees (`agent-<id>`)** — once the agent's patch is landed
  on your local `feat/` branch, which can be before the push; the worktree
  holds no unique work after that. Not while its agent may still be resumed
  via `SendMessage`: harness teardown preserves the work,
  `git worktree remove` does not.
- **The session's own feature worktree** — from the push (Gate 3), not the
  PR, but keep it until CI is green, since a Gate 5a fix is made there.

Nothing else removes them — a `worktree-agent-*` branch is never pushed, so
the harness never sweeps it — and a subagent cannot remove the worktree it
stands in.

### First: is this session itself inside a worktree?

If you ran `EnterWorktree` (every background job does), exit it as `CLAUDE.md`
step 8 says — `ExitWorktree` with `action: "keep"`, because `remove` would
also delete the branch and the removal below is the checked path. The
isolation guard that refuses `git -C <other worktree>` and
`git worktree remove` from inside is a different guard from the lock file; no
workaround (a wrapper script, a `cd` that hides the target, disabling the
sandbox) is in bounds.

### The checks

For each worktree on your own list:

```bash
name=$(basename <worktree>)
lock=$(git rev-parse --git-common-dir)/worktrees/$name/locked
[ -f "$lock" ] && echo "OWNED BY: $(cat "$lock")"  # -> skip, not yours
git fetch origin                                  # stale refs answer the wrong question
branch=$(git -C <worktree> branch --show-current)
git -C <worktree> status --porcelain              # must be EMPTY
git cherry <target> "$branch"                     # must print no '+' lines
git worktree remove <worktree>                    # never --force
```

- **Remove only when all three pass** — unlocked, clean, landed.
- A lock names its owner and pid: another job, or one of your own unfinished
  subagents. `fatal: cannot remove a locked working tree` is the guard
  working — skip the path and don't retry it.
- **Until the PR merges, `<target>` is the `feat/` branch, not
  `origin/main`** — the work is unmerged, so against `origin/main` everything
  looks unlanded. Before the push it is your local `<feat-branch>`
  (layer-agent worktrees only); after the push it is `origin/<feat-branch>`,
  which also proves the work reached the remote.
- **Use `git cherry`, not `git rev-list --count`** — rev-list counts SHAs, so
  a squash- or rebase-merged branch still looks ahead.
- A dirty `status` is uncommitted work that exists nowhere else: leave the
  worktree and tell the user what is in it.
- Removal keeps the branch, which is what makes it safe.
- A worktree whose root `node_modules` is a real directory, not a symlink
  (created before #410, or given a private tree for a dependency change),
  deletes slowly. Remove those one at a time with a generous timeout. An
  interrupted removal leaves a half-deleted worktree that needs `--force` —
  the flag's one legitimate use: on a worktree you own and were already
  removing, never `-f -f` on a locked one.
- `git worktree prune` is safe (it drops metadata for directories already
  gone); a loop over `git worktree list` is not.
- Leftovers from earlier sessions are a separate, explicitly requested
  cleanup — then the same three checks, one path at a time, still skipping
  every locked one.

### After the PR merged

The same three checks with `<target>` = `origin/main` — GitHub deletes the
`feat/` branch on merge, so `origin/<feat-branch>` no longer resolves.

- **A "removing will discard N commits" refusal is usually false.** The
  `ExitWorktree`/cleanup guard counts against your local `main`, which does
  not move when a PR merges on GitHub. Don't answer it with
  `discard_changes: true` on reflex; settle it:

  ```bash
  git fetch origin
  git merge-base --is-ancestor <branch> origin/main && echo MERGED || echo NOT-MERGED
  ```

  `MERGED` → discarding loses nothing. `NOT-MERGED` → the guard is right;
  keep the worktree and tell the user what is in it.

- **Fix the cause:** once the working tree is clean,
  `git merge --ff-only origin/main` syncs local `main` and the guard stops
  firing on merged branches.

### Scratchpad transfer buffers

An agent's `.claude/scratchpad*/` export is a transfer buffer, not a record.
Once the work is pushed, git holds it — delete the buffer in the same pass.

- **Not before the push.** Until then the export can be the only surviving
  copy, because idle agent worktrees are torn down with their uncommitted
  files.
- **Exact paths from your dispatch record, one at a time — never a
  wildcard.** A scratchpad has no lock file, so `rm -rf` on another job's
  buffer succeeds silently. Issue-keyed names are not ownership either: one
  issue collects variants across sessions (`1786/`, `1786-tests/`).
- Leftovers from earlier sessions are a separate, explicitly requested
  cleanup that first confirms no live job is still writing to them.

## 9. Deploy — never yours to run

Never run a deploy yourself — the pipeline owns them (currently paused to
manual dispatch), and any manual trigger is a push-class action that needs the
user's approval (→ `CLAUDE.md` "Deployment").
