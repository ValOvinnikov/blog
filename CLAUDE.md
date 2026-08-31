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
web → ui, service, db, auth, config, utils   service → config, utils (no React)
platform → db, auth, config, utils, studio   studio → config, utils (typegen source)
ui → config (no Sanity/fetch)               configs/* → consumed by all
db → config, utils (no React/Sanity)        auth → db, config, utils
insight → nothing (base of graph, like config/utils)
graph is acyclic
```

- `@blog/ui` is pure and prop-driven — never imports `service`/`sanity`/`fetch`.
- `@blog/service` is the only package importing the Sanity SDKs; never imports React.
- `@blog/db` is the only package importing the Neon/Drizzle SDKs — Postgres
  data (Auth.js sessions, comments, ratings, bookmarks, subscribers, tenants,
  memberships, admins, site config, audit events); never imports React or any
  Sanity SDK, and
  never imports/is imported by `@blog/service` (siblings, not dependents — see
  `.claude/agents/db.md`). **Imported only by the two apps and `@blog/auth`**,
  which binds the Auth.js adapter to its tables. Its `src/` library code never
  imports `@blog/insight` either — that stays the two apps' job, same as any
  other log call. The one exception is scoped to
  `packages/db/scripts/provision-tenant/`,
  `packages/db/scripts/deprovision-tenant/`, and
  `packages/db/scripts/recheck-tenant-owners/`, standalone CLI tools outside the
  request-handling path: they import `@blog/insight`'s `sanitizeLogMessage`
  directly rather than keeping their own drifted copy. Full rationale: `SPEC.md` §4.
- `apps/web` is the only place `ui` and `service` (and `db`) meet (Server
  Components fetch, pass typed props to `ui`).
- `@blog/auth` holds the Auth.js configuration both apps pass to their own
  `NextAuth()` call — providers, the Drizzle adapter, session strategy, cookie
  options. It sits above `db` (which owns the adapter tables) and **`db` must
  never import it**. Sharing it is what keeps a session valid across both apps;
  two independently maintained configs drift silently. See
  `.claude/agents/auth.md`.
- `apps/platform` is a separate Next.js app (its own deployment and domain) for
  the operator/tenant admin panel — it consumes `db`, `auth`, `config`,
  `utils` and `@blog/studio`, and **never Sanity or `@blog/service`
  directly**. It reaches the Studio only through `@blog/studio`'s mount
  component, which builds the Sanity config internally, so the ESLint
  `no-restricted-imports` group still bans `sanity`, `next-sanity`,
  `@sanity/*`, `groqd` and `@blog/service` under `apps/platform`. It owns its own
  presentational primitives (Text, Card, Icon, Button, …) as well as its
  interactive ones, all built on Base UI and styled in-app; nothing is added
  to `@blog/ui` for it. The one exception is
  `apps/platform/src/components/features/look/look-preview/preview-sample/`,
  which renders the tenant's real site (WindowChrome, BrandMark, Text,
  Button) so the live theme preview doesn't drift from what `apps/web`
  actually looks like — an ESLint `no-restricted-imports` guard confines
  `@blog/ui` imports under `apps/platform` to that one directory. See
  `.claude/agents/platform-app.md`.
- `@blog/studio` (`packages/studio`) is the Sanity Studio: schema types (the
  source of truth for every content shape), desk structure, content
  migrations, and a `StudioMount` component that takes plain strings
  (`projectId`, `dataset`, `basePath`, `title`), builds the Studio config
  **internally**, and renders it. It is a **package, not a deployed app** —
  `apps/platform` mounts it, which is what lets one Studio serve every tenant.
  Upstream is `config` and `utils` only. Nothing may export a _built_ config
  object out of the package: a Server Component calling the builder drags the
  Sanity SDK into the RSC graph, where `swr`, `sanity`'s bundled CSS and
  `sanity-plugin-media` all break under the `react-server` condition. See
  `.claude/agents/studio.md`.
- `@blog/insight` (`packages/insight`) holds the structured logger core —
  `createLogger`, `LOG_LEVEL`, and `sanitizeLogMessage`. Sits at the base of
  the dependency graph alongside `config`/`utils` — depends on nothing.
  `sanitizeLogMessage` is `@blog/insight`'s sole canonical implementation —
  `@blog/utils`'s former copy was removed once every call site migrated onto
  this package instead. Both apps consume it: `apps/web` and `apps/platform` each expose one
  shared logger at `src/utils/logger/logger.ts` carrying their own `service`
  value, and import that rather than calling `createLogger` per module.
  `service`, `db` and `auth` never log at all — failures reach the caller and
  the app layer logs them once, with request context. The one exception is
  `@blog/db`'s standalone `provision-tenant`/`deprovision-tenant`/
  `recheck-tenant-owners` CLI scripts, which import `sanitizeLogMessage` (not
  the logger) directly — see the `@blog/db` bullet above and `SPEC.md` §4. See
  `.claude/agents/insight.md`.
- Content shapes come from the generated Sanity types in `@blog/config`
  (`packages/config/src/sanity/generated/types.ts`, produced by typegen) —
  never hand-redeclared.

## Start here for any non-trivial task

Run the **`develop-feature`** skill first. It's the lifecycle playbook —
investigate → plan → delegate each layer → test → review → commit (deploy is
human-gated) — and it says which subagent owns which step. Subagents are not an
automatic pipeline; this skill is how the right ones get used in the right order.

## Mid-task decisions land in the ticket/spec before work continues

When a design/scope/behavior decision gets settled in conversation — the user
answers a clarifying question, a discussion converges on an approach, a
placement/UX call gets made — that decision is **not** real until it's written
into the governing issue body or spec/plan doc. A decision that lives only in
chat history is invisible to every subagent, which starts cold and knows only
what its dispatch prompt (sourced from the ticket/spec) tells it — and it's
just as invisible to the orchestrator's own future re-dispatches, which should
be pulling fresh context from the ticket/spec, not from memory of the
conversation. This is exactly how the newsletter-signup feature (#1044)
shipped wrong the first time: the "does the form show site-wide or is it
scoped/configurable" question was discussed and answered in chat, never
written back into the ticket, and implementation proceeded from the original
under-specified issue — landing it globally in the root layout, requiring a
revert (#1196).

**The sequence when a decision is reached mid-task:**

1. If a subagent is currently dispatched against the now-stale plan, stop
   relying on its output — interrupt/stop it if still running, or discard its
   result if it completes before you can. Don't let work proceed from context
   the decision just superseded.
2. Update the governing issue body (`gh issue edit`) or spec/plan doc
   (`docs/superpowers/specs/*`) to state the decision plainly, before any
   further implementation.
3. Only then dispatch (fresh, or resume) — and the dispatch prompt should
   quote/point at the now-updated ticket/spec, not restate the decision from
   the orchestrator's own recollection of the chat.

This applies to decisions a subagent couldn't have made on its own (design,
scope, placement, cross-cutting behavior) — not routine implementation
details a layer agent is already trusted to decide per its skill.

**The mirror-image failure: don't let a subagent silently resolve an
ambiguity instead of surfacing it.** The above covers a decision the user
already made mid-task; this covers a decision the user hasn't made yet
because the ticket itself is ambiguous or self-contradictory. When a
dispatched subagent's report says anything like "the issue said X but I did Y
because…" — it noticed a tension between the ticket's literal wording and
what it built, picked an interpretation, and explained its reasoning — that
is **not** a settled decision just because the reasoning sounds good. Stop,
present the tension plainly to the user (what the ticket says vs. what got
built vs. why), and get an explicit answer — before commit/push/PR, and
especially before reusing that same unconfirmed interpretation as precedent
for another ticket. This is exactly how issues #1251 and #1252 both shipped
a plain `prefix?: ReactNode` prop when their acceptance criteria literally
said "compound slot" (a specific, different, `mapCompoundSlots`-based pattern
in this codebase) — the implementing agent flagged the deviation in its own
report, the orchestrator read that reasoning and silently accepted it as
correct, and then propagated the same unconfirmed call into a second ticket
via "same pattern as #1251." The user only caught it after both PRs were
open, by asking why the implementation didn't match the ticket. A subagent's
self-reported judgment call is a flag to raise, not a decision to rubber-stamp.

## Use the scoped agents

Delegate layer work to the matching subagent in `.claude/agents/`, in dependency
order (`config → studio → service → ui → web` when config changes are involved,
otherwise `studio → service → ui → web`):
`config` (`packages/config`, `packages/utils`, `configs/*` — constants, route
helpers, shared config packages, alias wiring, guards typegen output), `studio`
(schemas/typegen), `service` (Sanity data layer), `ui` (design system), `web`
(frontend/SEO + composition).

`db` (`packages/db`, Neon/Drizzle relational data — Auth.js sessions,
comments, ratings, bookmarks, subscribers, tenants, memberships, admins, site
config, audit events) is a **sibling to `service`, not a step in that chain** — it has no
upstream layer of its own beyond `config`. Its consumers are the two apps plus
`@blog/auth`, which binds the Auth.js adapter to its tables.
Dispatch it whenever config/utils changes are settled and before the app work
that composes its queries: `config → db → web` (parallel to, not blocking,
`studio → service → ui`) when a feature touches both a Sanity-backed and a
Neon-backed concern. See `.claude/agents/db.md`.

`auth` (`packages/auth`, the shared Auth.js configuration — providers, the
Drizzle adapter, session strategy, cookie options) is a **thin layer above
`db`**, consumed only by the two apps: `config → db → auth → web`/`platform-app`.
Dispatch it when any of those change. Never dispatch it for authorization —
whether a signed-in user may see a page is each app's decision, made against an
`admins` or `memberships` row. See `.claude/agents/auth.md`.

`platform-app` (`apps/platform`, the operator/tenant admin panel — a separate Next.js
app, its own deployment and domain) is a **sibling to `web`, not a step in the
chain either**. Its only upstreams are `config`, `db`, and `auth`, so its
dispatch order is `config → db → auth → platform-app`; it never waits on
`studio`/`service`, which it does not consume. Base UI is installed and styled inside that app,
and it owns its own presentational primitives too — do not route its
components through the `ui` agent. The one exception is
`look-preview/preview-sample/`, an ESLint-guarded directory allowed to
import `@blog/ui` directly so the live theme preview renders the site's
real components. See `.claude/agents/platform-app.md`.

`insight` (`packages/insight`, the structured logger core — `createLogger`,
`LOG_LEVEL`, and `sanitizeLogMessage`, its sole canonical implementation) is
**independent, like `config`/`utils`** — depends on nothing, not a step in
any chain. Both apps consume it through their own shared logger module, so
dispatch `insight` only for changes to the logger core itself — a change to
how an app _uses_ the logger belongs to `web`/`platform-app`. See
`.claude/agents/insight.md`.

**Delegating in-scope work to its sub-agent is REQUIRED, not optional — for the
whole lifecycle, not just the first draft.** Every file that lives in a
sub-agent's domain (`config`/`studio`/`service`/`ui`/`web`/`db`/`platform-app`/`auth`/`insight` per the map above) is
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
exists to stop: a two-line orchestrator edit to a `config`/`studio`/`service`/`ui`/
`web`/`db`/`platform-app`/`auth` file is still the orchestrator doing a sub-agent's job. Route the fix to
the owning agent (dispatch, or `SendMessage` it), let it re-export, then
re-verify and re-review. "Small", "mechanical", "the agent already did the hard
part", and "it's a fix, not new code" are **not** exemptions — the only
orchestrator-hand edits are the out-of-scope list above.

**Dispatch subagents in the background by default.** Every Agent-tool
dispatch defaults to `run_in_background: true`. "The next step depends on
this result" does **not** justify `run_in_background: false` — background
dispatch preserves ordering too (the orchestrator resumes on notification,
then runs the dependent step); foreground only costs the ability to respond
to the user while it runs. Only the two exceptions below stay synchronous,
each for its own stated reason:

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

This list is exhaustive — every other dispatch (layer agents, `verify-runner`,
`reviewer`, `a11y-reviewer`, `seo-auditor`, `ci-watcher`, ...) runs in the
background. `verify-runner` before `reviewer` is **not** an exception:
dispatch it with `run_in_background: true` like everything else — the
orchestrator resumes on its completion notification and dispatches `reviewer`
then, same ordering as a synchronous wait would have given, without blocking
the ability to respond to the user in the meantime.

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
on a `verify-runner`/`reviewer`/`ci-watcher`/`board-keeper` call that isn't
one of the two exceptions above.** The rationalization is always the same
shape: "I can't commit/report/move on until I know whether this passed, so
I'll just wait for it synchronously." That reasoning is explicitly rejected in the
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
of the two exceptions above applies. If none does, the answer is `true`,
full stop — do not reopen the "but I need the result" argument, it was
already settled.

## The `@blog/ui` component index

`packages/ui/COMPONENTS.md` is a generated index of every `@blog/ui` component
— its purpose, props, and compound slots (`Header.Brand`, `PostCard.Media`, …)
— produced by `scripts/gen-ui-index.mjs`. **Consult it before deciding a feature
needs a new UI component:** it's the cheapest way to spot an existing component
to reuse or extend, and the `explore`, `ui`, and `web` agents are pointed at it
for the same reason (dispatch prompts can point there too). It's regenerated on
staged `packages/ui` changes by the pre-commit hook and guarded in CI via
`pnpm gen:ui-index:check` — drift (stale index), description coverage (every
exported component/slot documented), and structural completeness (no component
silently unindexed). Never hand-edit it; fix the source and regenerate. A future
`apps/web` index would live alongside its code as `apps/web/COMPONENTS.md`.

## Use the skills

- `develop-feature` at the start of any non-trivial task (lifecycle + delegation).
- `add-content-type` when a change spans more than one workspace.
- `studio-schema-practices` when touching `packages/studio` schemas or migrations.
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
- `refactor-sweep` for an on-demand, layer-scoped cleanup audit (duplication,
  dead code, convention drift) — no fixed cadence, run whenever asked;
  surfaces findings as tracked issues rather than editing directly. Staleness
  per layer tracked in `docs/context/refactor-sweep-log.md`.
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

- **Inline comments are forbidden by default.** No comment inside a
  function/component body narrating what a line, branch, or step does — if
  that feels necessary, restructure the code or rename something instead of
  explaining it (a competent developer can read the code). The single narrow
  exception: one line for something genuinely non-obvious the code truly
  cannot express on its own — a hidden constraint, a real gotcha, a
  workaround for a specific bug. That exception is rare; reach for it only
  when the alternative is a future reader silently re-breaking the same
  thing — never to restate what the code already says.
- **A doc comment is the only other kind allowed — at most one per
  function/component, and only when the name doesn't already make the
  purpose obvious.** It states what the function/component is **for**, in
  one short sentence — never **how** it works internally. That means: never
  a step-by-step walkthrough of its branches/hooks/implementation, never an
  exhaustive listing of props/functionality (the type signature already
  documents that), and never a decision-history narrative walking through
  every issue number that touched the file (that belongs in the PR
  description and rots as the code evolves further). If a doc comment is
  starting to read like a changelog, a design-doc summary, or an
  implementation walkthrough, it's too long — cut it down to the one
  sentence a future reader actually needs to know before calling it.

  **REQUIRED — a source comment must never reference project-management
  state.** This is a hard prohibition, not a length guideline. Specifically,
  never write into a comment in any `packages/*` or `apps/*` source file:

  - a path into `docs/superpowers/specs/*` or `docs/superpowers/plans/*`
  - a roadmap phase ("Phase 0", "Phase 8", "this milestone")
  - an issue or PR number (`#1234`) as narrative — see the TODO exception below
  - a "not wired up yet" / "future consumer will…" / "ships later" note

  **Why these specifically, beyond being verbose.** Each one is guaranteed to
  become false:

  - Spec and plan docs are **deleted** once their work ships and `SPEC.md`
    reflects the final shape (see the design-doc retention rule below), so a
    comment citing one is a dead link by construction.
  - Roadmap phases get renumbered and re-scoped. "Phase 8" was split and a new
    "Phase 0" inserted ahead of it mid-programme; every comment naming a phase
    silently went stale that day.
  - "Nothing reads this yet" is self-evident from the absence of callers, and
    stops being true the moment someone adds one — without touching the
    comment.

  All four belong in the **PR description**, which is dated, immutable, and
  discoverable via `git blame`. Code comments are none of those things.

  The test to apply: _would this sentence still be true and useful in a year if
  the roadmap were reorganised and the spec docs deleted?_ If no, delete it.

  **The one exception:** a `TODO:`/`FIXME:` may carry an issue number, in its
  own comment block, because it is a pointer to open work rather than a
  narrative about closed work.

  **Two more failure shapes, beyond the four above — state the current fact,
  not the fix's history.** Seen repeatedly across the CTA epic (#2300)
  despite dispatch prompts already carrying the general comment-discipline
  instruction:

  - **Narrating the mechanism or history of a change instead of the current
    invariant.** `basic-text-renderer.tsx`'s link handler once read: "Both
    `EXTERNAL` and `INTERNAL` links carry a resolved `url` here — the service
    derefs `content`'s markDefs before this component ever sees them, same as
    CTA `actions`." That's how a bug got fixed, not what the code does today.
    The fact a reader needs: `url` is already resolved for both link types;
    the fallback below handles one that failed to resolve. If a comment reads
    like it belongs in a commit message or PR description — explaining _why a
    change was made_ rather than _what holds true now_ — cut it down to the
    fact.
  - **Tying a shared/reusable component's own doc comment to its first
    specific consumer.** `ActionGroup` (`apps/web/src/components/shared/`) is
    general-purpose — CTA is its first caller, not its scope — but its doc
    comment read "renders a **CTA module's** authored actions," and a prop
    comment cited "Banner's dark scrim (D15)," a design-decision id from a doc
    that's since been deleted. Describe the component's actual, general
    contract; name the specific case that prompted it only if the doc comment
    would be meaningless without that context (rare for a component meant to
    be reused).

  **A `§4.2`-style section reference is the same dead-link problem as a
  `docs/superpowers/specs/*` path, just spelled differently — a design-doc
  section number is worthless once that doc is deleted per the retention
  rule below, which happens routinely within the same epic. Never cite one.**

- All workspace source files live under `src/` within each package/app.
  Exceptions: root-level config files required by their tool (`sanity.config.ts`,
  `sanity.cli.ts`, `next.config.ts`, `vitest.config.ts`, etc.) stay at the
  package root.
- **Absolute imports via per-workspace aliases.** Internal imports use the
  workspace's **own name** as the alias — `@blog/{pkg}/*` for packages
  (`@blog/config`, `@blog/service`, `@blog/ui`), `@{app}/*` for apps
  (`@web/*`, `@platform/*`). Same-directory `./` stays relative; **never**
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
- **Function style is decided per layer kind, and enforced by ESLint per
  workspace.** The React layers export _values_ — a component is a const
  holding a function — so `apps/web` and `packages/ui` use **arrow-function
  consts** (`func-style: ['error', 'expression', { allowArrowFunctions: true }]`
  in `configs/eslint/web.js`). `@blog/service` and `@blog/db` export
  _operations_, where `export function getPostBySlug()` is the ordinary
  Node/TypeScript idiom, so they keep **declarations**. The rule codifies what
  the repo already looks like rather than imposing something new. Only
  `apps/web`'s half is wired today; `apps/platform` (arrow) and `service`/`db`
  (declaration) are tracked separately, so don't read an unenforced workspace
  as licence to drift. The exceptions and the Next.js reserved-export carve-out
  live in `.claude/agents/web.md` § "Function style".
- **Key/value-pair consts are always both UPPERCASE** (key === uppercase value),
  `as const`, and live in `@blog/config` (`constants/`). e.g.
  `export const LINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;`
  The uppercase value is the stored/serialized value, so schema `options.list`
  and migrations use it too; derive unions with `(typeof C)[keyof typeof C]`.

  **The exception is a storage layer's own vocabulary** — a const whose values
  that layer persists, read _only_ by that layer and the app on top of it.
  Those live with the layer that stores them. Everything else stays in
  `@blog/config`, which remains the default.

  `@blog/db` owns `TENANT_STATUS`, `TENANT_PLAN`, `MEMBERSHIP_ROLE`,
  `ADMIN_ROLE`, `GRANTED_VIA` and `TENANT_PROVISIONING_*` on that basis.

  **Reach is the test — not how the column is typed.** Those six are stored
  three different ways (`pgEnum`, plain `text().$type<>()`, and a `jsonb` map
  keyed by step) and it makes no difference. The counter-example is
  `PRESET_ID` / `FONT_CHOICE` / `RADIUS_SCALE` / `DENSITY`: they _do_ back
  `pgEnum` columns in `site-config.ts`, yet stay in `@blog/config` because
  `packages/studio` reads all four and `apps/web` / `@blog/service` read some.
  Backing a `pgEnum` neither qualifies a const nor disqualifies one.

  **`AUDIT_ACTION` / `AUDIT_TARGET_TYPE` are a deliberate exception** and stay
  in `@blog/config`. Only `db` and `apps/platform` read them today, so by reach
  alone they would move — but auditing is a cross-cutting concern whose
  vocabulary grows as more surfaces become auditable, and `audit_events`
  stores both as plain `text().$type<>()` precisely so a new action never
  needs a schema change. Pinning that vocabulary inside the storage layer
  would put it behind the wrong door. Don't "fix" this by relocating them.

  Where a const _does_ back a `pgEnum`, it and its column move together:
  `Object.values(…)` builds the enum's value list, so reordering the const
  silently reorders a Postgres enum. Confirm with `db:generate` that no
  migration appears.

  Shape and casing rules are unchanged wherever a const lives; only the home
  moves. "Only one app happens to use it today" is not enough — the layer has
  to be where the values are actually persisted.

- `'use client'` never in `@blog/ui` (it stays pure and prop-driven). The one
  package that may carry it is `@blog/studio`, whose mount component is
  irreducibly client-side; that exception is scoped to that component and does
  not license the directive anywhere else in `packages/*`. In
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
- **No bare `console.*` — log through the app's shared logger.** `apps/web`
  and `apps/platform` each own one logger at `src/utils/logger/logger.ts`
  (`createLogger({ service })` from `@blog/insight`); import it rather than
  calling `createLogger` per module, or the `service` field that separates the
  two apps' lines is lost. `service`, `db`, and `auth` never log at all —
  they return the failure to the caller, and the app layer logs it once with
  request context. The rule is declared as `no-console` in
  `configs/eslint/base.js`, which also exempts tests; every other exemption is
  layered in a per-workspace preset, because flat-config `files` globs resolve
  against the consuming workspace and not the repo root — `insight.js` for the
  logger itself, `db.js` for that package's `scripts/**` and
  `drizzle.config.ts`, `web.js` for `e2e/**`, each being a place where stdout
  _is_ the interface. Root and `packages/studio` scripts need no entry: they are
  `.mjs`, outside the rule's `.ts`/`.tsx` scope.
  Event names are static, lowercase and dot-namespaced; dynamic values go in
  the context object, never interpolated into the name.
  **Log the gap between what the user was told and what actually happened —
  no gap, no log:** a specific, self-correctable message (a validation error,
  a duplicate slug) is the whole truth and needs no line, while a deliberately
  vague one hides the cause and must be logged. A `TResult` failure is not
  automatically an `error` — branch on the `ERROR_CODE` and log only what a
  human would act on. Full contract in `SPEC.md` §17.
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
  wrong, the **schema** in `packages/studio` is wrong — fix it there and regenerate.
- **Check for migrations.** Content is live in the `production` dataset, so any
  change that alters an _existing_ shape — renaming/removing/moving a field,
  renaming a `_type`, restructuring a document — orphans data unless existing
  documents are migrated. Before implementing, decide: does this need a data
  migration? If yes, **surface a migration plan and prompt the user** (which
  documents/fields change, the `sanity/migrate` transform, dry-run → backup →
  human-gated run) — do not just change the schema. Additive, optional-only
  changes need no migration; say so explicitly. Use the tooling and workflow in
  `packages/studio/migrations/` (`README.md` + `migrate:dry`/`migrate:run`/`dataset:export`).
  Migrations against `production` are human-gated like `sanity deploy`.
- **Check for `db` (Neon/Drizzle) migrations too.** Any change to a
  `packages/db/src/schema/*.ts` table needs a generated migration — a schema
  edit never touches existing rows by itself. Workflow: `db:generate`
  (produces the reviewable SQL diff — this step _is_ the dry-run, since
  drizzle-kit never touches the database at generate time) → back up the
  shared/production Neon branch first → human-gated apply, same production
  gate as Sanity's. Full mechanism in `.claude/agents/db.md`'s "Migrations"
  section. Never hand-edit a migration file once it has been applied
  anywhere shared (dev or prod) — write a new corrective migration instead.
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
  layer (`config → studio → service → ui → web` when config changes are involved,
  otherwise `studio → service → ui → web`; dependency order) so each review stays
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
- **Design-doc retention:** a `docs/superpowers/specs/*`/`plans/*` doc is
  "done" once its PR(s) merged **and** `SPEC.md` reflects the final shape —
  **delete** it (both the spec and its paired plan, if one exists) in the
  same PR that does that `SPEC.md` sync. `SPEC.md` is the durable record of
  final behavior; a design doc's job ends once its decisions are reflected
  there, so it doesn't linger as a second, driftable copy. See
  `docs/README.md` for the live index. (Superseded 2026-07-27: earlier
  revisions of this rule archived shipped docs into
  `docs/archive/superpowers/{specs,plans}/` instead of deleting them — that
  bucket is now frozen history, not an active destination; do not add new
  entries to it.)
- **Docs sync:** [`docs/context/ci-automation.md`](docs/context/ci-automation.md)
  documents every workflow in
  `.github/workflows/` and the required status checks — a PR that adds or
  changes a workflow updates that file in the same PR. Likewise a PR that
  changes agent tooling (`.claude/` hooks/agents/skills/settings) updates
  [`docs/context/claude-code.md`](docs/context/claude-code.md).
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
   `node_modules` (`docs/context/claude-code.md`), but they still pile
   up. **The trigger is the push at step 6, not the PR** — a pushed branch is
   recoverable, which is the entire safety condition; a layer-agent worktree
   goes even earlier, once its patch is landed on the `feat/` branch, while the
   session's own feature worktree stays until CI is green so a Gate 5a fix has
   somewhere to happen. See `develop-feature` step 8 for the safety checks, and
   for why a post-merge "will discard N commits" refusal is usually a stale
   local `main` rather than real work — never delete uncommitted work.

   **Only the ones _this session_ created.** Several Claude jobs run in
   parallel on this machine and share `.claude/worktrees/`, so
   `git worktree list` shows other jobs' live worktrees too — build the
   removal list from your own dispatch record, never from that listing.
   Every live session/agent worktree carries a lock file
   (`$(git rev-parse --git-common-dir)/worktrees/<name>/locked`) naming its
   owner and pid; if it exists, the worktree is not yours to touch — skip it.
   `git worktree remove` failing with `fatal: cannot remove a locked working
tree` is that guard working, so never answer it with `-f -f` or
   `git worktree unlock`: forcing it destroys a live session's uncommitted
   work (it already cost #669's config agent its work once).

   **The same pass clears the scratchpad transfer buffers** the agents
   exported into (`.claude/scratchpad*/`, gitignored) — after the push, not
   before it, since that export can be an agent's only surviving copy until
   the work reaches the remote. Delete the exact directories this session
   created. Parallel jobs share that tree too, and unlike a worktree a
   scratchpad has **no lock file**: a wildcard `rm -rf` destroys another
   running job's in-flight buffer with no error and no warning.

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
- Run a `db:migrate` against the shared/production Neon branch by hand — same
  human-gated stance as `sanity deploy` and production content migrations
  (`.claude/agents/db.md`'s "Migrations" section); local/dev applies are fine.
- Push or open a PR without explicit approval for that specific action.
  (Committing needs no approval — commit freely as work reaches a coherent state.)
