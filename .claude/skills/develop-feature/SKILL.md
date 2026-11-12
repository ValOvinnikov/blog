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
every session needs, and the orchestrator-only rules it points at sit after §9
below. Every issue then follows the gate sequence in
`open-pull-request` — committing is free; push and PR are two separate
approvals, never bundled.

## 0. Decide the shape

- Trivial / single-file / one layer → dispatch that layer's agent directly,
  skipping the multi-layer recipe (still test + review).
- Spans multiple layers → use the `add-content-type` recipe and delegate per
  layer as below.
- Filing a ticket for a 2+-layer feature → an epic plus one sub-issue per
  layer, created in one `board-keeper` dispatch (→ `write-ticket` "A feature spanning 2+ layers always gets an epic" for the rule, "Never call `gh issue create` directly" for the dispatch). An existing multi-layer issue
  is not re-filed.
- One PR per layer, merged one at a time (→ "Planning work — mandatory, not advisory" below): steps 1–8 run to completion for one layer, then
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
  is the hypothesis to hand `explore`, not to check yourself. Its prompt names
  the absolute path of the checkout to search, under the same dispatch
  contract as the reviewers in step 6.
- **Ask `explore` for the nearest existing sibling** — the schema, loader,
  component, view or migration most like what is being built — as a path plus
  one line on how it differs. It goes into every layer brief (step 3, item 6);
  an agent briefed without one re-invents the shape and clones code.
- Uncertain of a library API, CLI flag or config format → run `use-context7`
  now, before the plan.
- **Migration check** → "Migrations" below. Decide now; when the change is purely
  additive, say explicitly that no migration is needed.
- **Voice check** → list every public-site string the work adds or rewords,
  including the copy a new `@blog/ui` text prop will carry once `web` wires
  it, each with a recommended classification ("Check for Voice candidates" below). This is the plan's **Copy** line.
- **Manual-test check** → if the change alters what a page shows or how it
  behaves, the plan carries a manual-test issue (step 2).
- **Cost check** → list every new or changed cron, Workflow run, paid API
  call, Blob/KV use and hot-path query with its expected volume and whether
  it stays inside the free allowances, or "none". This is the plan's
  **Cost** line ("Say what it touches before starting" below).
- Surface unknowns early; ask only when a decision is genuinely the user's.
- **Follow Gate 0 in `open-pull-request`** — board → In Progress, the branch,
  and its exception for worktree-delegated work. For multi-layer work, run
  `superpowers:using-git-worktrees` before delegating.

## 2. Plan (main session)

- New behaviour or more than one layer → run `superpowers:brainstorming`
  before writing the plan.
- Order the steps by dependency and never reverse it:
  `config → studio → typegen → service → ui → web`, and
  `config → db → auth → platform-app` on the platform side, and
  `config → db → worker` for provisioning runs. Drop the layers that don't
  change.
- Mark the unaffected layers; their agents are not invoked. Note which agent
  owns each step.
- **Put the split to the user before the first dispatch**, carrying every
  line "Say what it touches before starting" below requires. Once they
  approve it:
  - write the settled Copy classifications into the ticket body, and name
    each key's list (`VOICE_FIELDS` or `VOICE_FIXED_KEYS`) in the dispatch
    prompt;
  - a string an agent reports under **Voice candidates** that the plan did
    not list goes to the user before commit.
- Each ticket's `## Scope` carries a `Feature doc:` line —
  `update | create | none` (→ "Docs that ship with the change" below and the sub-issue template in `write-ticket` "Issue body template").
- **Migration flagged** → it is an explicit plan step, sequenced right after
  schema + typegen and before `service` consumes the new shape; its plan goes
  to the user before implementing (→ "Migrations" below).

### Manual-test issue

Any change that alters what a page shows or how it behaves — UI, copy,
routing, validation, interaction, user-visible caching or revalidation —
ships with a manual-test issue.

- **Create it with the implementation tickets**, in the same `board-keeper`
  dispatch: a sub-issue of the epic, or linked from the single ticket.
  Labels: `manual-test` plus the same `prio:*` label as the work.
- **Write the body from the manual-test template** in `write-ticket` "Issue body template".
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
| Provisioning Workflow runs (`apps/worker`)                   | `worker`       | `testing-practices`                                                                 |
| Structured logging (`createLogger`, log sanitization)        | `insight`      | `testing-practices`                                                                 |
| Email shell, `escapeHtml`, `sendEmail` transport             | `email`        | `testing-practices`                                                                 |

For any React component, `ui`, `web` and `platform-app` apply
`react-component-practices` before their layer skill. `studio` may run
typegen in its worktree to check its schema; the authoritative run is yours,
in §5. `db`, `auth`, `platform-app`, `worker`, `insight` and `email` are not steps in
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
   report says so. **State in the brief that only the sibling's structure and
   naming are the model** — anything in it a rule forbids (a doc block, a
   hardcoded or recomputed value, repeated test setup) is drift to leave
   behind (→ `CLAUDE.md` "Existing code is evidence, never the standard"), or
   the agent copies it into one more file.

**The docs the PR owes are yours to write**, because `docs/**` and `SPEC.md`
sit outside every agent's scope (→ "Docs that ship with the change" below). Write them before step 6 so the reviewer sees them.

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
  `*.test.ts(x)`, `src/testing/` and `__mocks__/` by
  `test-writer-scope-guard.sh`, and returns a test that
  needs a product change as a finding for you to route to the owning agent.
- Tests run once per layer when implementation is complete, not after each
  file.
- New routes or metadata: sanity-check `sitemap` and RSS.
- `test-writer` cannot commit: copy each test file its report lists onto the
  branch by path, delete the ones it lists for deletion, and commit them
  before step 5.
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

**A hook or script diff** (`.claude/hooks/**`, `scripts/*.sh`) also runs,
locally before commit, the commands of the `Shellcheck .claude/hooks and
scripts` and `Guard tests` steps in `.github/workflows/workflow-security.yml` — read them from that
file, the one list CI runs. Such a diff is not docs-only, so it still gets
`reviewer` in step 6.

Every check passes before step 6. `verify-runner` only reports the failing
command and trimmed output; diagnose it yourself or route the fix to the
owning agent, then re-dispatch. Never proceed on red.

## 6. Review (blocking — Gate 2 is not offered until this passes)

**Run `git fetch origin` before dispatching any reviewer** (`reviewer`,
`correctness-reviewer`, `a11y-reviewer`, `seo-auditor`) — a worktree session's local `main` goes
stale, and the read-only guard denies them `git fetch`.

**Every reviewer prompt carries:**

1. **The checkout.** The absolute path of the checkout under review; the
   agent's first command is `cd <path>` and every later one carries the same
   `cd … &&`. None of them is worktree-isolated — their own worktree would
   miss the uncommitted changes — so without the path they run in the shared
   checkout, where a worktree-isolated session's harness refuses them.
2. **The base and count.** The base as `origin/main`, never bare `main`, and
   the expected file count (`git diff origin/main...HEAD --name-only | wc -l`,
   plus dirty working-tree files) so the reviewer can flag a mismatch.
3. **The ticket.** The issue number, its **Copy** and **Cost** lines, and each
   implementing agent's **Examined** and **Reuse** sections, verbatim — never
   summarised, since §7's Reuse, drift, cost and Voice items are checked
   against them. `correctness-reviewer` takes the issue's acceptance
   criteria verbatim instead, and `reviewer`'s prompt says whether
   `correctness-reviewer` was dispatched.

Each report opens with `pwd` and `git rev-parse HEAD`. **Reject a report whose
SHA differs from your own `HEAD`**, or that names none, and re-dispatch.

- **`reviewer`** (`.claude/agents/reviewer.md`) over the full diff
  (`origin/main...HEAD` + working tree); it applies `code-review-practices`.
  A docs-only diff gets the inline identifier check instead (`CLAUDE.md`
  delivery gate step 4).
- **`correctness-reviewer`** (`.claude/agents/correctness-reviewer.md`, Opus)
  as well, in the same message as `reviewer`: it checks the diff against the
  acceptance criteria and for security, performance and correctness defects,
  and leaves conventions to `reviewer`. **Skip it when every changed file is
  styling, copy, a story or a doc** — a `*-variants.ts` or `.css` file, a
  `packages/config/src/voice/` catalog, a `*.stories.tsx`, a `.md` — and say
  so in `reviewer`'s prompt, which then runs the general pass itself. One
  file outside that list dispatches it.
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
- **A fix round is a re-review.** Open the re-dispatch with
  `Re-review of <sha>` — the `HEAD` the previous report named — followed by
  that report's blocking findings, plus the three items above — except that
  the count is now `git diff <sha> --name-only | wc -l` plus untracked files.
  The reviewer confirms each finding and reads only the files changed since
  `<sha>`. A merge from `origin/main` since `<sha>` needs a full review
  instead.
- **Non-blocking findings don't gate the PR, but never leave one only in a
  chat summary.** Each one worth doing is fixed on this branch by the owning
  agent when it is the same layer and small, or else filed through
  `board-keeper` before moving on (→ `write-ticket` "Findings found mid-work get fixed in the current work"). Say which ones you are not acting on, and why.

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
(Gate 6; → `open-pull-request` "Board reconciliation").

## 8. Remove the subagent worktrees you created

`open-pull-request` "Delivery gate sequence" step 8 states the rules — your own dispatch record
only, lock files, an isolated session exiting first, scratchpads by exact
path. This section is when; the procedure and its checks are in
`worktree-cleanup.md`.

**When:**

- **Layer-agent worktrees (`agent-<id>`)** — once the agent's patch is landed
  on your local `feat/` branch, which can be before the push; the worktree
  holds no unique work after that. Not while its agent may still be resumed
  via `SendMessage`: harness teardown preserves the work,
  `git worktree remove` does not.
- **The session's own feature worktree** — from the push (Gate 3), not the
  PR, but keep it until CI is green, since a Gate 5a fix is made there.
- **Scratchpad transfer buffers (`.claude/scratchpad*/`)** — in the same pass,
  never before the push.

**Read `worktree-cleanup.md` (beside this file) before removing anything** —
the three checks every removal must pass (unlocked, clean, landed), the
`<target>` to check against before and after the merge, exiting your own
worktree first, and deleting scratchpads by exact path. Never a wildcard or a
loop over `git worktree list`, and `--force` only for the interrupted-removal
case that file describes.

## 9. Deploy — never yours to run

Never run a deploy yourself — the pipeline owns them (currently paused to
manual dispatch), and any manual trigger is a push-class action that needs the
user's approval (→ `open-pull-request` "Deployment").

## Planning work — mandatory, not advisory

These are requirements, not guidance: a bundled PR wastes review time and hides
what actually changed.

### Split by workspace, always

**The main workspaces are the unit of work: `studio`, `service`, `ui`, `web`,
`platform`, `worker`.** Plan every non-trivial task as one chunk per workspace,
and ship one PR per chunk. The supporting packages — `config`, `utils`, `db`, `auth`,
`insight`, `email` — get no chunk of their own by default: a small change to one
rides along in the PR of whichever main workspace needs it.

**Combine chunks only when splitting them would break.** The test is
mechanical: would the earlier PR merge to `main` green on its own? Renaming a
shared `_type`, symbol or generated type reds `type-check` in every consumer
until they all land, so those consumers belong in one PR. Anything that merges
green alone ships alone. "It's all one feature", "the split is more work" and
"they're small" are not reasons to combine.

### One layer at a time — merged before the next starts

**The chunks ship in dependency order, and each one is approved and merged
before work on the next one begins.** For a feature that touches every main
workspace that is `studio → service → ui → web` (`config` first when it
changes, `db → auth → platform-app` for the platform side); a feature that
skips a layer skips that step. The next layer's branch is cut from a `main`
that already contains the previous layer, so its agent builds against the
merged shape and every review is of one layer against `main` — a later layer
never bakes in a shape an earlier layer's review then changes.

The sequence is: dispatch the current layer's agent → verify → review →
commit → push and PR (each gate approved separately) → wait for the merge →
only then dispatch the next layer. Waiting for the merge is idle time on this
feature, not a cue to branch the next layer off the open PR — that is a stack.
**Two exceptions, and only two**, neither invoked silently:

- **The user says to stack.** Then, and only then, the chain ships through `gh stack` (`open-pull-request` "PR conventions"). The orchestrator never chooses
  to stack — not to save a wait, not because the layers are small, not because
  the next one is "obvious".
- **A hard dependency that prevents the split** (the green-alone test fails, as
  with a rename every consumer reads). The affected layers are one PR — a
  combination, not a stack — and that is stated in the split put to the user
  before the first dispatch.

### Split by surface too, not only by workspace

Workspace is one axis; **consumers are the other**. When a feature introduces
something several places must then adopt — a new schema type, a shared
component, a field helper, a constant — introducing it is one PR, and **each
place that starts using it is another**. Never bundle "add X" with "and convert
the six places that will use X". Epic #3164 is the worked example: (1) add the
`link` document and its Links sidebar section, (2) re-use it in the CTA module,
(3) navigation and footer, (4) hero modules, (5) Portable Text, (6) retire the
legacy shapes — six PRs, each independently reviewable and revertible.

The axes compound: an adopting PR that spans studio + service + web because a
schema shape changed is still one PR, because splitting it further would red
`type-check`.

### Put the split to the user before starting

Whatever split you arrive at, **state it and get agreement before the first
dispatch**: which PRs, in what order, what each contains, and what you have
deliberately left out of scope. The split is the user's decision to accept or
change — not a status update delivered after the work is already under way.

### Say what it touches before starting

Before the first dispatch — and again whenever the answer changes mid-task —
state plainly:

- **Parts touched** — every workspace, not just the obvious one.
- **Dependencies** — what must land before what, and which independent tickets
  can run in parallel; within one feature the layers never do ("One layer at a
  time").
- **Constraints** — migrations, human gates, anything that cannot be split.
- **Copy** — every visible string on the public site the work adds or rewords,
  including the copy a new `@blog/ui` text prop will carry once `web` wires it,
  each with a recommended classification, Voice or fixed, per "Check for Voice
  candidates" — or "none". The user's approval of the split settles them, and
  they go into the ticket body before dispatch.
- **Manual test** — whether the change alters what a page shows or how it
  behaves; if so, its manual-test issue is filed with the tickets
  (§2 above, template in `write-ticket` "Issue body template").
- **Cost** — every new or changed cron, Workflow run, external API call
  (Resend, Anthropic/AI Gateway, Sanity Management), Blob/KV use and
  per-request database query on a hot path, each with its expected volume and
  whether it stays inside the free allowances — or "none". It goes into the
  ticket's `## Scope` as a `Cost:` line, and the PR body states it.
- **Doubts** — including scope you suspect but have not yet confirmed.

**If anything blocks, ask and wait for an answer.** Never proceed on an
assumption, and never absorb newly-discovered scope silently. Discovering
mid-task that a change reaches more workspaces than the ticket said is the
moment to stop and ask — editing the ticket to match what you already built is
backwards.

## Mid-task decisions land in the ticket/spec before work continues

When a design/scope/behaviour decision gets settled in conversation — the user
answers a clarifying question, a discussion converges, a placement/UX call gets
made — it is **not** real until it is written into the governing issue body or
spec/plan doc. A decision that lives only in chat is invisible to every
subagent, which starts cold from its dispatch prompt, and to the orchestrator's
own later re-dispatches. (The newsletter signup shipped site-wide and was
reverted because its "site-wide or scoped?" answer never left the chat.)

**The sequence when a decision is reached mid-task:**

1. If a subagent is currently dispatched against the now-stale plan, stop
   relying on its output — interrupt it if still running, or discard its
   result if it completes before you can.
2. Update the governing issue body (`gh issue edit`) or spec/plan doc
   (`docs/superpowers/specs/*`) to state the decision plainly, before any
   further implementation.
3. Only then dispatch (fresh, or resume) — with a prompt that quotes or points
   at the updated ticket/spec, not one restating the decision from memory of
   the chat.

This applies to decisions a subagent couldn't have made on its own (design,
scope, placement, cross-cutting behaviour) — not routine implementation details
a layer agent is already trusted to decide per its skill.

**The mirror-image failure: a subagent silently resolving an ambiguity.** A
report saying anything like "the issue said X but I did Y because…" means the
agent picked an interpretation of an ambiguous or self-contradictory ticket —
**not** a settled decision, however good the reasoning sounds. Stop, put the
tension to the user (what the ticket says vs. what got built vs. why), and get
an explicit answer before commit/push/PR; never reuse the unconfirmed
interpretation as precedent for another ticket. (Two tickets once shipped a
plain `prefix?: ReactNode` prop where their criteria said "compound slot",
the second copying the first's accepted deviation.) A subagent's self-reported
judgment call is a flag to raise, not a decision to rubber-stamp.

## Use the scoped agents

Delegate layer work to the matching subagent in `.claude/agents/`, in
dependency order (`config → studio → service → ui → web` when config changes
are involved, otherwise `studio → service → ui → web`): `config`
(`packages/config`, `packages/utils`, `configs/*` — constants, route helpers,
shared config packages, alias wiring, guards typegen output), `studio`
(schemas/typegen), `service` (Sanity data layer), `ui` (design system), `web`
(frontend/SEO + composition). The other layer agents sit beside that chain;
what each package owns is in `CLAUDE.md` "Layer contracts":

- **`db`** is a sibling to `service`, not a step in that chain — no upstream
  beyond `config`. Dispatch it once config/utils changes are settled and before
  the app work that composes its queries (`config → db → web`/`platform-app`).
  When a feature touches both a Sanity-backed and a Neon-backed concern, the
  `db` step takes its place in the split like any other layer — merged before
  the next starts, never in parallel with `studio → service → ui` ("One layer
  at a time"). See `.claude/agents/db.md`.
- **`auth`** is a thin layer above `db`, consumed only by the two apps:
  `config → db → auth → web`/`platform-app`. Never dispatch it for
  authorization — whether a signed-in user may see a page is each app's
  decision, made against an `admins` or `memberships` row.
- **`platform-app`** is a sibling to `web`:
  `config → db → auth → platform-app`, never waiting on `studio`/`service`,
  which it does not consume. It owns its presentational and interactive
  primitives on Base UI — never route its components through the `ui` agent
  (the `site-preview/` exception is in `CLAUDE.md` "Layer contracts").
- **`worker`** is a sibling to `platform-app`: `config → db → worker`, never
  waiting on `studio`/`service`/`ui`/`auth`, which it does not consume. A
  change to what the admin panel enqueues is `platform-app` work; the run
  itself is `worker` work.
- **`insight`** is independent, like `utils`. Dispatch it only for the logger
  core itself; a change to how an app _uses_ the logger belongs to
  `web`/`platform-app`.
- **`email`** sits low, upstream of `utils` only. Dispatch it for the email
  templates and transport; a change to _which_ copy a caller passes belongs to
  that caller's layer.

**Delegating in-scope work to its sub-agent is REQUIRED, not optional — for the
whole lifecycle, not just the first draft.** Every file in a sub-agent's domain
(`config`/`studio`/`service`/`ui`/`web`/`db`/`platform-app`/`worker`/`auth`/`insight`/`email`)
is written, changed, fixed, renamed and reworked **by that sub-agent** — the
initial implementation, every review-remediation, every follow-up tweak, every
"it's one line" edit. The orchestrator _orchestrates_; it does not hand-author
or hand-patch a layer's files because doing it itself feels faster. Handing a
sub-agent pre-written stubs, or editing its files after it hands them back,
both bypass the layer's skill conventions. Describe structure in the prompt;
never write it to disk first. (The one exception is a solo cloud session with
no subagent tooling — `CLAUDE.md` "Solo-session mode".)

**What the orchestrator does with its own hands is exactly the work that falls
OUTSIDE every sub-agent's scope:**

- Governance/process docs it owns: `CLAUDE.md`, `.claude/**` (agents, skills,
  hooks, settings), `SPEC.md`, `README.md`, `docs/**` (specs, plans, feature
  pages).
- The mechanical **scratchpad → branch assembly** of a sub-agent's _own_
  exported output — a file copy, not authoring. Reconciling a trivial transfer
  conflict is fine; rewriting the content goes back to the sub-agent.
- `pnpm typegen` (it mutates generated files; `develop-feature` §5).
- Orchestration itself: git, `gh`, the board (via `board-keeper`), dispatching
  agents, and running the delivery gates.

Everything else — a groqd tweak, a variant class, a schema field, a route, a
`*.test.ts(x)` edit, a two-line rename fix — is a **dispatch** (a fresh Agent,
or `SendMessage` to continue the owning agent with its context intact), never a
direct orchestrator edit.

**Known failure mode — the "I'll just fix this one small thing myself" trap.**
When a review finding or a rename / knip / lint nit needs a two-line change in
a layer file, patching it inline _feels_ faster than re-dispatching. It is
still the orchestrator doing a sub-agent's job: route the fix to the owning
agent (dispatch, or `SendMessage` it), let it re-export, then re-verify and
re-review. "Small", "mechanical", "the agent already did the hard part" and
"it's a fix, not new code" are **not** exemptions — the only orchestrator-hand
edits are the out-of-scope list above.

**Dispatch subagents in the background by default.** Every Agent-tool dispatch
defaults to `run_in_background: true`. Background dispatch preserves ordering —
the orchestrator resumes on the completion notification and runs the dependent
step then — so "the next step depends on this result" does **not** justify
`run_in_background: false`; foreground only costs the ability to answer the
user while it runs. Exactly two dispatches stay synchronous, each for its own
reason:

- Gate 0 (`open-pull-request`): `board-keeper` with the
  `"starting work on #<n>"` trigger — the branch checkout right after it
  depends on the issue (and any parent) actually being In Progress first.
  **Starting parallel work on several sibling sub-issues at once is one batched
  dispatch — `"starting work on #86, #87, #88, #89"` — never one `board-keeper`
  dispatch per issue** (`board-keeper.md` Step 1d).
- Step 7 of the delivery gate sequence (`open-pull-request` Gate 5):
  `gh pr create`, then set the board status — the PR URL isn't reported until
  that board write is confirmed.

Every other dispatch — layer agents, `verify-runner` (including right before
`reviewer`), `reviewer`, `correctness-reviewer`, `a11y-reviewer`,
`seo-auditor`, `ci-watcher`, … —
runs in the background.

**Known failure mode — `run_in_background: false` on anything else.** The
rationalization is always "I can't commit/report/move on until I know whether
this passed". It is already rejected above: the ordering is identical either
way, and a synchronous `reviewer` once left a live user message unanswerable
until it returned. Before setting `false`, name which of the two exceptions
applies. If none does, the answer is `true` — do not reopen the argument.

**Completion arrives as a notification — never poll.** The harness delivers a
`task-notification` the moment a background agent finishes; that, not a manual
check, is the signal to read the result and run the dependent step. Never
simulate a foreground wait (sleeping, re-dispatching the same check in a loop,
re-reading the agent's output file). Until it arrives, keep answering the user
and dispatching independent work.

**`board-keeper` needs no `isolation` argument on the dispatch** — it carries
`isolation: worktree` in its own frontmatter, and that line is load-bearing: a
worktree-isolated session refuses every command whose working directory
resolves back to the shared checkout, which is where a non-isolated subagent's
Bash lands, so without it the dispatch makes zero board writes. Don't
"simplify" the frontmatter by dropping it (`board-keeper.md` § "Why this agent
carries `isolation: worktree`").

## Migrations

- **Until launch, no content migrations (decided 2026-10-27).** Production is
  replaced at launch, not upgraded: both Neon databases are recreated from one
  baseline migration, every existing content migration is deleted, and every
  tenant, the first production one included, is created from starter content.
  Until then:

  - Write no Sanity content migration, no hand-written data fix (an SQL
    backfill) and no expand/contract pair. A change to an existing content
    shape updates the starter content in `packages/config/src/starter-content/`
    instead, so a new tenant starts at the current shape. Dev content it leaves
    broken is fixed by the dev reset, not by a migration.
  - Drizzle schema migrations are still generated for every table change —
    dev's database only gets new columns that way — and must apply to dev's
    existing rows, so a new `NOT NULL` column needs a default.
  - The two rules below return at launch, in the "deploy first, then migrate"
    form of epic #6152
    (`docs/superpowers/specs/2026-10-27-deploy-first-migrations-design.md`).

- **Check for migrations — from launch.** Suspended until then by the rule
  above; until launch, a changed shape updates the starter content instead.
  Content is live in the `production` dataset, so any
  change that alters an _existing_ shape — renaming/removing/moving a field,
  renaming a `_type`, restructuring a document — orphans data unless existing
  documents are migrated. Before implementing, decide: does this need a data
  migration? If yes, **surface a migration plan and prompt the user** (which
  documents/fields change, the `sanity/migrate` transform, dry-run → backup →
  human-gated run) — do not just change the schema. Additive, optional-only
  changes need no migration and no contract step; say so explicitly.

  **A migration that changes an existing shape ships in two releases —
  expand, then contract.** A release migrates content before the new web is
  deployed, and the web still live reads the old shape until that deploy
  lands, so removing or renaming a shape in the same release breaks the live
  site for that window and leaves no way back. **Expand** adds the new field or
  value, copies the data across and keeps the old shape, so the deployed web
  keeps working. **Contract** removes the old shape in a later release, once no
  code reads it. The expand ticket files its contract follow-up, labelled
  `prio:later`, when it is created. Use the tooling and workflow in
  `packages/studio/migrations/` (`README.md` +
  `migrate:dry`/`migrate:run`/`dataset:export`). Migrations against
  `production` are human-gated like `sanity deploy`.

- **Check for `db` (Neon/Drizzle) migrations too.** Any change to a
  `packages/db/src/schema/*.ts` table needs a generated migration — a schema
  edit never touches existing rows by itself. Workflow: `db:generate` (the
  reviewable SQL diff — this step _is_ the dry-run, since drizzle-kit never
  touches the database at generate time) → back up the shared/production Neon
  branch first → human-gated apply, same production gate as Sanity's. Full
  mechanism in `.claude/agents/db.md`'s "Migrations" section. Never hand-edit a
  migration file once it has been applied anywhere shared (dev or prod) —
  write a new corrective migration instead.

## Check for Voice candidates

- **Check for Voice candidates.** Every visible string in the public site's
  catalog (`packages/config/src/voice/site-messages.*.json`) sits on one of two
  lists. `VOICE_FIELDS` strings are tenant-editable, per language, in the
  platform's Voice page. `VOICE_FIXED_KEYS` strings are fixed and translated
  by us. Which list a new or reworded string joins is the **user's** decision,
  put to them in the plan's **Copy** line ("Say what it touches before
  starting"). Neither the orchestrator nor a layer agent settles it.
  - Recommend Voice for page-level prose an editor writes in the site's own
    voice: an empty state, or the heading or supporting text of a page like
    the 404 or error page.
  - Recommend fixed for everything else: buttons, links, toggles, badges,
    statuses, form and section labels, page names that a fixed menu link
    repeats, copy that states what the code enforces, third-party names,
    accessibility-only strings, toasts and ICU counters.
  - The editable set has no cap. A new string that meets the rule is a
    candidate however many fields already exist.
  - The cost of wiring a field (db, the platform page, its preview specimen)
    belongs in the recommendation, never in the decision.
  - A feature that starts in `@blog/ui` lists its copy at the `ui` step. The
    component's props already decide whether the copy can be a Voice field,
    such as one rich message versus a title, body and action.
  - A string a layer agent first reports mid-task under **Voice candidates**
    goes to the user before commit.
  - `apps/platform`'s own UI copy is never Voice.

## Docs that ship with the change

- **Edit-time format + lint feedback.** The checked-in `PostToolUse` hook
  `.claude/hooks/post-edit.sh` feeds each edited/written file to
  `post-edit-prettier.sh` then `post-edit-lint.sh`: Prettier formats it
  (silent, always exits 0), then every `.ts`/`.tsx` file is linted from its own
  workspace and errors — layer-boundary violations included — come straight
  back to the agent in the same turn. Lint stays report-only (never `--fix`),
  as does lint-staged's ESLint pass, so a commit never changes content beyond
  Prettier formatting and the reviewed diff is the committed diff; commit-time
  gates stay authoritative. Why it is one wrapper and not two hooks or an `&&`
  chain: `docs/context/claude-code.md`.

- **Spec sync:** a PR that changes architecture, layer contracts, data flow,
  env vars or a cross-cutting rule updates `SPEC.md` — the architecture core —
  in the same PR. A content-model change updates its feature page, plus any
  `SPEC.md` §6 entry that still describes that shape.
- **Feature docs:** `docs/features/<feature>.md` is the per-feature reference —
  what it does, surfaces and routes, data (Sanity documents, Neon tables),
  configuration and plan gating, constraints and invariants, dependencies,
  entry points, tests and stories, related epics. Every shipped feature has a
  page, listed in `docs/features/README.md`. A PR that changes a feature's
  behaviour updates its page in the same PR, and a PR that adds a feature adds
  its page. Every ticket's `## Scope` carries a `Feature doc:` line.
- **Design-doc retention:** a `docs/superpowers/specs/*`/`plans/*` doc is
  "done" once its PR(s) merged **and** its final shape is in the feature page —
  **delete** it, with its paired plan, in the PR that does that sync. The
  design retires into its feature page, not into `SPEC.md`, which takes only
  the architecture-core changes ("Spec sync"); it never lingers as a second,
  driftable copy. `docs/README.md` is the live index; `docs/archive/` is frozen
  — add nothing to it.

  **A doc may also be retired early, before its work ships,** when its epic has
  been cut into self-contained tickets and the doc has become a second copy of
  them — the drift, not the doc's age, is the trigger. Move the cross-cutting
  shape (the parts no single ticket owns) into the **epic issue body**, repoint
  every ticket and sibling doc at the epic, and delete the doc in that same
  change. The epic body then states that it is the design of record and that
  the feature-page sync is owed by the epic's final PR — feature pages and
  `SPEC.md` describe only built behaviour, so neither is written ahead of the
  work.

- **Docs sync:** a PR that adds or changes a workflow in `.github/workflows/`
  or a required status check updates `docs/context/ci-automation.md` in the
  same PR; a PR that changes agent tooling (`.claude/` hooks, agents, skills,
  settings) updates `docs/context/claude-code.md`.
- `.claude/skills/` is the single home for skills — edit one copy, no mirror.
- **A rule added to a skill or agent guide for one app covers the other
  too.** `apps/web` and `apps/platform` share every convention unless the guide
  names a reason one of them differs (platform has no `modules/`, no page
  builder, no SEO surface). When a rule lands in `web.md`, check
  `platform-app.md` states the same thing, and the reverse. The same goes for a
  shared skill whose examples name only one app.

## Skills by task

- `develop-feature` at the start of any non-trivial task (lifecycle + delegation).
- `add-content-type` when a change spans more than one workspace.
- `code-review-practices` before every commit — applied by the `reviewer`
  subagent at gate step 4.
- `review-pull-request` when an open PR needs review before merge — a cloud
  session's PR always does; a PR from this lifecycle already passed step 6.
- `refactor-sweep` for an on-demand, layer-scoped cleanup audit (duplication,
  dead code, convention drift) — run when asked, naming the layer; it files
  findings as issues rather than editing.
- `open-pull-request` when shipping an issue: branch → work → PR (push and PR
  are human-gated).
- `superpowers:systematic-debugging` on any bug or failing test, before
  proposing a fix.
- `superpowers:test-driven-development` for a bugfix: the owning layer agent
  writes the failing regression test first, then makes it pass. New-feature
  coverage instead comes from the `test-writer` subagent's pass after
  implementation lands (`develop-feature` §3/§4); a layer agent building new
  feature code does not pre-write its own tests.
- `superpowers:verification-before-completion` before any "done"/"fixed"/
  "passing" claim — run the verification commands and confirm their output.
- `superpowers:writing-skills` when creating or editing anything under
  `.claude/skills/`.
- `vercel:nextjs` and `vercel:next-cache-components` for App Router, Server
  Component, caching, ISR or Partial Prerendering work in `apps/web`.
- `vercel:react-best-practices` for performance work in `apps/web` or
  `apps/platform` — `react-component-practices` → "Vercel's React rules" lists
  which of its rules apply and which this repo overrides.
- `vercel:deployments-cicd` when changing the deploy pipeline or
  `.github/workflows/` CI config.
- `frontend-design:frontend-design` for visual design work in `packages/ui`
  or `apps/web`.

## What `pnpm verify` runs

- Verify with `pnpm verify` from root — one `&&` chain over `type-check`,
  `lint`, `test`, the warn-only `check:test-budget` (it names any test file
  over its time budget but never fails locally; CI's Test job enforces it),
  the local-only file-size ratchet `check:file-size` (`CLAUDE.md` "File size budgets"),
  the local-only `check:layer-contracts` (`SPEC.md` §4 and the `CLAUDE.md`
  layer diagram against each `package.json`),
  `knip`, the seven gating scripts (`check:client-graph`,
  `check:revalidate-tags-sync`, `check:turbo-env-sync`,
  `check:migration-index`, `gen:ui-index:check`, `gen:const-index:check`,
  `gen:migration-ids:check`)
  and the local-only diff checks `check:diff-hygiene` (the judgement-free
  half of `code-review-practices` §0) and `check:touched-lint`, so it stops at the first failure and mirrors every required or gating CI check that has a local
  equivalent (`docs/context/ci-automation.md` maps them). `pnpm build` is not
  part of the local loop — CI's `ci.yml` `build` job gates every PR; reproduce
  it locally only when diagnosing an actual CI build failure
  (`open-pull-request` Gate 5a).
