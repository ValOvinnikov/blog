# CLAUDE.md

Guidance for working in this repo. See `SPEC.md` (architecture — the single
durable reference) and `docs/BACKLOG.md` (ticket-ready roadmap).
`docs/archive/IMPLEMENTATION_BRIEF.md` is frozen history — do not read it for
current behaviour, and when it disagrees with `SPEC.md`, the spec wins.

## What this is

A Turborepo + pnpm monorepo for a headless-CMS blog. Sanity Studio (v6) authors
content; a Next.js 16 App Router site renders it; types flow end-to-end.

## Layer contracts (do not violate)

```
web → ui, service, config, utils   service → config, utils (no React)
ui → config (no Sanity/fetch)      cms → config (types via typegen)
configs/* → consumed by all        graph is acyclic
```

- `@blog/ui` is pure and prop-driven — never imports `service`/`sanity`/`fetch`.
- `@blog/service` is the only package importing the Sanity SDKs; never imports React.
- `apps/web` is the only place `ui` and `service` meet (Server Components fetch,
  pass typed props to `ui`).
- Content shapes come from the generated Sanity types in `@blog/config`
  (`packages/config/src/sanity/generated/types.ts`, produced by typegen) —
  never hand-redeclared.

## Start here for any non-trivial task

Run the **`develop-feature`** skill first. It's the lifecycle playbook —
investigate → plan → delegate each layer → test → review → commit (deploy is
human-gated) — and it says which subagent owns which step. Subagents are not an
automatic pipeline; this skill is how the right ones get used in the right order.

## Use the scoped agents

Delegate layer work to the matching subagent in `.claude/agents/`, in dependency
order (`config → cms → service → ui → web` when config changes are involved,
otherwise `cms → service → ui → web`):
`config` (`packages/config`, `packages/utils`, `configs/*` — constants, route
helpers, shared config packages, alias wiring, guards typegen output), `cms`
(schemas/typegen), `service` (data layer), `ui` (design system), `web`
(frontend/SEO + composition).

**Delegating in-scope work to its sub-agent is REQUIRED, not optional — for the
whole lifecycle, not just the first draft.** Every file that lives in a
sub-agent's domain (`config`/`cms`/`service`/`ui`/`web` per the map above) is
written, changed, fixed, renamed, and reworked **by that sub-agent** — the
initial implementation, every review-remediation, every follow-up tweak, every
"it's one line" edit. The orchestrator _orchestrates_; it does not hand-author
or hand-patch a layer's files because doing it itself feels faster. Handing a
sub-agent pre-written stubs, or editing its files after it hands them back, both
bypass the layer's skill conventions and break the delegation model. Describe
structure in the prompt; never write it to disk first.

**What the orchestrator does with its own hands is exactly the work that falls
OUTSIDE every sub-agent's scope:**

- Governance/process docs it owns: `CLAUDE.md`, `.claude/**` (agents, skills,
  hooks, settings), `SPEC.md`, `README.md`, `docs/**` (specs/plans).
- The mechanical **scratchpad → branch assembly** of a sub-agent's _own_
  exported output — a file copy, not authoring (see the worktree-teardown
  handoff). Reconciling a trivial transfer conflict is fine; rewriting the
  content is not — that goes back to the sub-agent.
- `pnpm typegen` (it mutates generated files; `develop-feature` §5).
- Orchestration itself: git, `gh`, the board (via `board-keeper`), dispatching
  agents, and running the delivery gates.

Everything else — a groqd tweak, a variant class, a schema field, a route, a
`*.test.ts(x)` edit, a two-line rename fix — is a **dispatch** (a fresh Agent,
or `SendMessage` to continue the owning agent with its context intact), never a
direct orchestrator edit.

**Known failure mode — the "I'll just fix this one small thing myself" trap.**
When a review turns up a blocking finding in a layer file, or a rename / knip /
lint nit needs a two-line change, patching it inline _feels_ faster than
re-dispatching the owning agent. That feeling is the rationalization this rule
exists to stop: a two-line orchestrator edit to a `config`/`cms`/`service`/`ui`/
`web` file is still the orchestrator doing a sub-agent's job. Route the fix to
the owning agent (dispatch, or `SendMessage` it), let it re-export, then
re-verify and re-review. "Small", "mechanical", "the agent already did the hard
part", and "it's a fix, not new code" are **not** exemptions — the only
orchestrator-hand edits are the out-of-scope list above.

**Dispatch subagents in the background by default.** Every Agent-tool
dispatch defaults to `run_in_background: true`. "The next step depends on
this result" does **not** justify `run_in_background: false` — background
dispatch preserves ordering too (the orchestrator resumes on notification,
then runs the dependent step); foreground only costs the ability to respond
to the user while it runs. Only the three exceptions below stay synchronous,
each for its own stated reason:

- `verify-runner` before `reviewer` (`develop-feature` skill §5, and
  `verify-runner.md`'s own frontmatter) — reviewer genuinely cannot run
  before verify's pass/fail is known.
- Gate 0 (`open-pull-request` skill): `board-keeper` with the
  `"starting work on #<n>"` trigger — the branch checkout right after it
  depends on the issue (and, if any, its parent) actually being set to In
  Progress first. **Starting parallel work on several sibling sub-issues at
  once (e.g. dispatching multiple layer subagents in the same turn) is one
  batched dispatch — `"starting work on #86, #87, #88, #89"` — never one
  `board-keeper` dispatch per issue** (`board-keeper.md`'s Step 1d).
- Gate 7 below: `gh pr create`, then set the board status — the PR URL isn't
  reported until that board write is confirmed, so that one board-keeper
  dispatch stays synchronous.

This list is exhaustive — every other dispatch (layer agents, `reviewer`,
`a11y-reviewer`, `seo-auditor`, `ci-watcher`, ...) runs in the background.

**How completion is detected — no polling, no synchronous wait.** The
orchestrator never needs to block on a background dispatch to learn its
result, and must never invent one (sleeping, re-dispatching the same check
in a loop, or repeatedly reading the agent's output file) to simulate a
foreground wait. The harness delivers a `task-notification` automatically
the moment a background agent finishes — that notification, not a manual
check, is the signal to read the result and run the dependent step. Until it
arrives, the orchestrator stays fully responsive: keep answering the user,
keep dispatching other independent work, keep doing anything else that
doesn't depend on the pending result. A background dispatch is "fire, stay
unblocked, act on notification" — never "fire, then find some other way to
wait."

**Known failure mode — read this before typing `run_in_background: false`
on a `reviewer`/`ci-watcher`/`board-keeper` call that isn't one of the three
exceptions above.** The rationalization is always the same shape: "I can't
commit/report/move on until I know whether this passed, so I'll just wait
for it synchronously." That reasoning is explicitly rejected in the
"Dispatch subagents in the background by default" paragraph above ("The next
step depends on this result" does **not** justify `run_in_background:
false`) — but it's easy to type the override anyway
because it _feels_ like a real blocker in the moment, not a rationalization.
It isn't: background dispatch means the harness resumes you on completion
and you do the dependent step then — the ordering is identical either way.
The only thing foreground costs you is the ability to answer the user while
it runs, which is exactly the failure this note exists to prevent (a
synchronous `reviewer` dispatch left no way to respond to a live user
message until it returned, blocking a real conversation for no ordering
benefit). Before setting `run_in_background: false` on anything, name which
of the three exceptions above applies. If none does, the answer is `true`,
full stop — do not reopen the "but I need the result" argument, it was
already settled.

## Use the skills

- `develop-feature` at the start of any non-trivial task (lifecycle + delegation).
- `add-content-type` when a change spans more than one workspace.
- `cms-schema-practices` when touching `apps/cms` schemas or migrations.
- `ui-library-practices` when touching `packages/ui`.
- `web-component-practices` when building or editing an interactive component in
  `apps/web` (popover/menu/disclosure/clipboard/focus) or composing `@blog/ui`
  with client state.
- `ui-storybook` when adding or editing stories in `packages/ui`.
- `web-storybook` when adding or editing stories in `apps/web`.
- `testing-practices` when adding/updating tests.
- `seo-and-metadata` when changing routes, metadata, or feeds.
- `code-review-practices` before every commit — applied by the `reviewer`
  subagent at gate step 4 (see the delivery gate sequence below).
- `open-pull-request` when shipping an issue: branch → work → PR → assign (push is human-gated).
- `use-context7` before implementing against any library API you are not certain
  of — resolves live, version-matched docs via the context7 MCP server. Use
  whenever you hit a deprecation, an unfamiliar config format, or a CLI flag you
  would otherwise guess at.
- `superpowers:systematic-debugging` on any bug or failing test, before
  proposing a fix.
- `superpowers:test-driven-development` when implementing any feature or
  bugfix, before writing implementation code — pairs with this repo's own
  `testing-practices` for what a good test looks like here.
- `superpowers:verification-before-completion` before any "done"/"fixed"/
  "passing" claim — run the verification commands and confirm their output
  first.
- `superpowers:writing-skills` when creating or editing anything under
  `.claude/skills/`.
- `vercel:nextjs` for App Router / Server Components / Next.js API work in
  `apps/web`.
- `vercel:next-cache-components` for caching, ISR, or Partial Prerendering
  work in `apps/web`.
- `vercel:deployments-cicd` when changing the deploy pipeline or
  `.github/workflows/` CI config.
- `frontend-design:frontend-design` for visual design work in `packages/ui`
  or `apps/web`.

## Conventions

- All workspace source files live under `src/` within each package/app.
  Exceptions: root-level config files required by their tool (`sanity.config.ts`,
  `sanity.cli.ts`, `next.config.ts`, `vitest.config.ts`, etc.) stay at the
  package root.
- **Absolute imports via per-workspace aliases.** Internal imports use the
  workspace's **own name** as the alias — `@blog/{pkg}/*` for packages
  (`@blog/config`, `@blog/service`, `@blog/ui`), `@{app}/*` for apps
  (`@web/*`, `@cms/*`). Same-directory `./` stays relative; **never**
  parent-traversal `../`, and **never** a shared `#/`/`@/` (a shared prefix
  hijacks a dependency's identically-named alias across packages, and breaks
  the Turbopack build / cross-package type-check). Each workspace's
  `tsconfig.json` `paths` **and** `vitest.config.ts` alias declare its own
  alias **plus each dependency's** alias (e.g. `web` maps `@web`, `@blog/ui`,
  `@blog/service`, `@blog/config`). **When a workspace starts consuming a new
  package, add that dependency's alias to the consumer's `tsconfig` + `vitest`**
  — otherwise type-check/test/build fail. Unique per-workspace prefixes resolve
  cleanly in tsc (`Bundler`), Next/Turbopack, Sanity's esbuild extract, and vitest.
- TypeScript `strict`; no `any`. Server Components by default.
- **Key/value-pair consts are always both UPPERCASE** (key === uppercase value),
  `as const`, and live in `@blog/config` (`constants/`). e.g.
  `export const TLINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;`
  The uppercase value is the stored/serialized value, so schema `options.list`
  and migrations use it too; derive unions with `(typeof C)[keyof typeof C]`.
- `'use client'` never in `@blog/ui` (it stays pure and prop-driven). In
  `apps/web` it IS the right tool — add it at the _leaf boundary_ that
  genuinely needs the client: React hooks (`useState`/`useEffect`), browser
  APIs, event handlers, or wrapping a third-party component that uses hooks
  internally (e.g. the `sanity-image` wrapper). Keep it as low in the tree as
  possible, not on whole pages.
- **Destructure a value into local bindings once, right after the point that
  settles its shape — then use those bindings, not repeated inline access.**
  General practice, not just page components: whenever a function reads more
  than one field of an object more than once — a fetched `service` result past
  its null/`notFound` guard, a props object, a parsed config — destructure it
  once near the top of the scope where the shape is settled, then reference
  the local bindings for the rest of the function. Never repeat
  `result.data.x`/`post.x`/`props.x` inline at each use site once the shape is
  already known. Canonical case: a page/route component destructures its
  fetched result right after the guard (`const { title, posts, currentPage,
totalPages } = result.data;`) — but the same rule applies anywhere a shape
  is read repeatedly. This keeps "we've already established this" visible in
  one place instead of re-deriving or re-typing the same access path at every
  usage.
- Co-locate `*.test.ts(x)`; `pnpm test` must pass.
- After a schema change: `pnpm typegen`, then commit the regenerated files in
  `packages/config/src/sanity/generated/`. Typegen can be non-deterministic —
  re-run until the diff is minimal.
- **Never hand-edit the generated types.** `packages/config/src/sanity/generated/`
  is deny-listed for Edit/MultiEdit/Write in `.claude/settings.json`, so an
  attempt is blocked outright ("denied by your permission settings"). That is
  not an obstacle to route around — a shell write (`echo >`, `sed -i`) is not
  blocked, but it is still wrong: a hand-edit is silently undone by the next
  `pnpm typegen` and caught by CI's typegen drift guard. If a generated type is
  wrong, the **schema** in `apps/cms` is wrong — fix it there and regenerate.
- **Check for migrations.** Content is live in the `production` dataset, so any
  change that alters an _existing_ shape — renaming/removing/moving a field,
  renaming a `_type`, restructuring a document — orphans data unless existing
  documents are migrated. Before implementing, decide: does this need a data
  migration? If yes, **surface a migration plan and prompt the user** (which
  documents/fields change, the `sanity/migrate` transform, dry-run → backup →
  human-gated run) — do not just change the schema. Additive, optional-only
  changes need no migration; say so explicitly. Use the tooling and workflow in
  `apps/cms/migrations/` (`README.md` + `migrate:dry`/`migrate:run`/`dataset:export`).
  Migrations against `production` are human-gated like `sanity deploy`.
- Verify with `pnpm type-check`, `pnpm lint`, `pnpm test` from root. `pnpm build`
  is not part of the local loop — CI's `ci.yml` `build` job gates every PR;
  only reproduce it locally when diagnosing an actual CI build failure
  (`open-pull-request` Gate 5a).
- **Edit-time format + lint feedback:** checked-in `PostToolUse` hooks
  (`.claude/hooks/post-edit-prettier.sh` then `.claude/hooks/post-edit-lint.sh`,
  chained as one command in `.claude/settings.json` since matching hooks
  otherwise run in parallel) format every edited/written file with Prettier,
  then lint every `.ts`/`.tsx` file on the formatted content and feed errors —
  including layer-boundary violations — straight back to the agent in the
  same turn. Prettier is silent and always exits 0 (formatting, not review);
  lint stays report-only (never `--fix`); commit-time gates stay authoritative.
- **Conventional commits, one concern per PR — mechanically enforced.**
  `.husky/commit-msg` runs commitlint (`commitlint.config.mjs`) on every
  local commit; the **Commitlint** CI workflow (`commitlint.yml`) re-checks
  the full PR commit range as a backstop. Allowed types: config-conventional's
  defaults (`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
  `revert`, `style`, `test`) plus this repo's own `tooling`; scope is
  free-form (component/area name) but must be lower-case. Merge commits
  (local or `Merge pull request #…`) are explicitly skipped; Dependabot's
  `chore(deps): …` messages are not separately exempted — they pass because
  they're already conventional.
- **Prefer per-layer PRs.** Split a multi-layer feature into separate PRs per
  layer (`config → cms → service → ui → web` when config changes are involved,
  otherwise `cms → service → ui → web`; dependency order) so each review stays
  small and focused. **Split only when each layer's PR merges to `main` green
  on its own** (typically additive changes). Keep it a single PR when a partial
  merge would break the build — e.g. renaming a shared `_type` or generated
  type that downstream consumes reds `type-check` until every layer lands.
  **Only the completing PR includes `Closes #<n>`** — earlier layer PRs
  reference the issue without an adjacent closing keyword (GitHub auto-closes
  on the literal substring regardless of tense). See `open-pull-request`'s
  "Scope: prefer per-layer PRs" and "PR body template" sections for the exact
  wording rule and the board-Status gotcha if an issue is auto-closed
  prematurely.
- **Spec sync:** any PR that changes architecture, layer contracts, env vars,
  or the content model updates `SPEC.md` in the same PR.
- **README sync:** `README.md` §"CI & automation" documents every workflow in
  `.github/workflows/` and the required status checks — a PR that adds or
  changes a workflow updates that section in the same PR. Likewise a PR that
  changes agent tooling (`.claude/` hooks/agents/skills/settings) updates
  §"Working with Claude Code".
- `.claude/skills/` is the single home for skills — edit one copy, no mirror.

## Delivery gate sequence (mandatory — never skip or bundle)

Every issue follows this exact order. **Committing is free (no approval needed); stop and wait for explicit user approval at the push and PR gates.**

1. Set issue → In Progress on the board
2. Checkout branch from `main`
3. Do the work + run quality gates
4. **Dispatch the `reviewer` subagent** (`.claude/agents/reviewer.md`) over the
   full diff — fix blocking findings and re-dispatch until it returns
   `APPROVE`. Never **push** without an `APPROVE` on the diff as it
   stands; new changes invalidate a prior `APPROVE`.
5. **Commit** the reviewed work — no approval needed; committing is free (local
   and reversible). Don't push it yet.
6. **Ask to push** — explicit approval required; separate question; wait for answer
7. **Ask to open PR** — separate question, after push; wait for answer.
   Once approved: run `gh pr create`, then **immediately** set the issue → Code Review
   on the board — do not report the PR URL until the board update is done.
   Then dispatch `ci-watcher` (background) to watch CI to completion, and
   diagnose and fix any failure it reports (`open-pull-request` Gate 5a) — a
   fix push still needs its own fresh push-approval ask, same as any push.
8. **Remove the subagent worktrees you created** (no gate — just do it). Nothing
   else will: the harness never auto-sweeps them because `worktree-agent-*`
   branches are never pushed. Worktrees share the main checkout's
   `node_modules` (README §"Working with Claude Code"), but they still pile
   up. See `develop-feature` step 8 for the safety checks — never delete
   uncommitted work.

**Broad instructions ("go ahead", "keep going", "pick the next issue") authorize the work and commits — never the push or PR.** Those two gates always require fresh, explicit confirmation.

**Board reconciliation (not a gate — no approval needed).** After step 7 opens
a PR, and again after any PR merges, dispatch the `board-keeper` subagent
(`.claude/agents/board-keeper.md`) with a targeted trigger (`"after PR
#<n>"` / `"after merge of #<n>"`). Board mutations have silently failed
before — it re-queries every status write it makes to confirm it actually
stuck. This targeted dispatch does **not** sweep the rest of the board by
default (routine PR/merge events are cheap, single-issue checks now,
per `board-keeper.md`'s own "Input you receive" section) — append "...also
reconcile the board" when you have a specific reason to check further, or
dispatch it bare with no issue number for a full sweep on demand (e.g.
whenever asked to "reconcile the board", at the start of a session, or
before answering a project-status question). It never edits code and only
applies safe, forward-only status corrections; anything that looks
destructive (e.g. reopening a wrongly-closed issue) comes back in its report
for you to act on.

**Never call `gh issue create` directly — creating an issue always goes
through `board-keeper`.** Dispatch it with `"create issue: title=..., body=...,
labels=...(, parent=#<n>)"`; it creates the issue, places it on the board,
confirms status and labels, links it to a parent if given, and only then
reports the issue number back — creation and placement happen as one
verified operation instead of two steps where the second could be skipped.
Before dispatching, gather every required field — **title** (conventional-
commit style), **body** (context + acceptance criteria), **at least one
label**, and a **parent issue number** if this is a sub-issue of an existing
tracking issue — asking the human for anything missing rather than guessing;
`board-keeper` has no interactive-prompt tool, so this gathering only happens
here, before dispatch, never inside it.

**A feature spanning 2+ layers always gets an epic (parent) issue plus one
sub-issue per layer — never a single flat issue covering multiple layers.**
This mirrors "prefer per-layer PRs" one level earlier: ticket structure
informs PR structure, not the other way around. Gather every sub-issue's
title/body/labels up front, same as any other creation, then dispatch
`board-keeper` once with the whole set — it creates the epic first, then
each sub-issue with `parent=<epic-number>`, using its existing batch-dispatch
support (one Step 1 pull covers the whole batch, not one per issue).

## Deployment

Deploys are automated by the pipeline (see `docs/DEPLOY.md`, `SPEC.md` §13):
merge to `main` → **development**; push a `vX.Y.Z` git tag → **production**
(gated by a CI `verify` job). Dev deploys only the app(s) whose turbo graph the
merge touched (`turbo-ignore`); a production tag always deploys both.
The one-time environment setup (datasets, tokens, Vercel projects, GitHub
secrets, webhooks, CORS) is human-gated console work in `docs/DEPLOY.md`.
Cutting a release is `git tag vX.Y.Z && git push origin vX.Y.Z` — a
push, so it stays under the push gate.

## Don't

- Run `sanity deploy` / Vercel deploys by hand (the pipeline owns them;
  console setup is human-gated) — this includes the `vercel` plugin's
  `/deploy` command, `deployment-expert` subagent, and `deploy_to_vercel`
  MCP tool; `.claude/settings.json` denies the underlying `vercel --prod` /
  `vercel deploy --prod` / `vercel promote` / `vercel rollback` commands and
  the MCP tool as a backstop, but treat `vercel:deployments-cicd` and the
  plugin's commands as read-only reasoning aids, never a way to trigger a
  deploy.
- Read or commit `.env*` files.
- Add a cross-layer import that creates a cycle.
- Push or open a PR without explicit approval for that specific action.
  (Committing needs no approval — commit freely as work reaches a coherent state.)
