# CLAUDE.md

Guidance for working in this repo. `SPEC.md` is the architecture core — layer
contracts, data flow, cross-cutting rules — and `docs/features/<feature>.md` is
the per-feature reference ("Feature docs" under Conventions). Open work lives on
the project board ("Ticket priority & triage"); `docs/BACKLOG.md` is the
ticket-ready roadmap. `docs/archive/` is frozen history — never read it for
current behaviour; when it disagrees with `SPEC.md`, the spec wins.

## What this is

A Turborepo + pnpm monorepo for a headless-CMS blog. Sanity Studio (v6) authors
content; a Next.js 16 App Router site renders it; types flow end-to-end.

## Layer contracts (do not violate)

```
web → ui, service, db, auth, config, utils   service → config, utils (no React)
platform → db, auth, config, utils, studio   studio → config, utils (typegen source)
ui → config, utils (no Sanity/fetch)        configs/* → consumed by all
db → config, utils (no React/Sanity)        auth → db, config, email
config → utils (OKLCH maths behind the shared contrast guard)
insight → nothing (base of graph, like utils)
email → utils (sits low; both apps and auth consume it)
graph is acyclic
```

- `@blog/ui` is pure and prop-driven — never imports `service`/`sanity`/`fetch`.
- `@blog/service` is the only request-path package importing the Sanity SDKs;
  never imports React. (`@blog/studio` is the Studio and schema owner;
  `@blog/db`'s provisioning exception is below.)
- `@blog/db` is the only package importing the Neon/Drizzle SDKs — Postgres
  data: Auth.js users and sessions, tenants and their domains, memberships and
  invites, admins, site config, feature toggles, email config and templates,
  subscribers, bookmarks, audit events and findings (comments and ratings are
  planned; no tables exist yet). It never imports React or `@blog/service`
  (siblings, not dependents — `.claude/agents/db.md`), and is **imported only
  by the two apps and `@blog/auth`**, which binds the Auth.js adapter to its
  tables. It imports no Sanity SDK, and its `src/` never imports
  `@blog/insight` — logging is the apps' job. Two scoped exceptions, both in
  standalone CLI tools outside the request path (`SPEC.md` §4):
  `packages/db/scripts/provision-tenant/` uses `@sanity/client` to seed a new
  tenant's content, and five tools — `provision-tenant/`,
  `deprovision-tenant/`, `recheck-tenant-owners/`,
  `validate-tenant-documents/` and `migrate-tenant-content/` — import
  `sanitizeLogMessage` directly rather than keep a drifted copy.
- `apps/web` is the only place `ui` and `service` (and `db`) meet (Server
  Components fetch, pass typed props to `ui`).
- `@blog/auth` holds the Auth.js configuration both apps pass to their own
  `NextAuth()` call — providers, the Drizzle adapter, session strategy, cookie
  options. It sits above `db` (which owns the adapter tables) and **`db` must
  never import it**. Sharing it is what lets a session issued by one app be
  accepted by the other; two independently maintained configs drift silently.
  It does not by itself make one sign-in _span_ both origins — that is
  `AUTH_COOKIE_DOMAIN`, deliberately left unset, so each origin is signed into
  separately (`docs/context/environment-variables.md`). See
  `.claude/agents/auth.md`.
- `apps/platform` is a separate Next.js app (its own deployment and domain) for
  the operator/tenant admin panel — it consumes `db`, `auth`, `config`, `utils`
  and `@blog/studio`, and **never Sanity or `@blog/service` directly**: it
  reaches the Studio only through `@blog/studio`'s mount component, and ESLint
  `no-restricted-imports` bans `sanity`, `next-sanity`, `@sanity/*`, `groqd`
  and `@blog/service` there. It owns its presentational primitives (Text, Card,
  Icon, Button, …) as well as its interactive ones, built on Base UI and styled
  in-app; nothing is added to `@blog/ui` for it. The one exception is
  `apps/platform/src/components/features/site-preview/`, which renders the
  tenant's real site with `@blog/ui` so the live theme preview cannot drift
  from `apps/web` — an ESLint guard confines `@blog/ui` imports under
  `apps/platform` to that directory. See `.claude/agents/platform-app.md`.
- `@blog/studio` (`packages/studio`) is the Sanity Studio: schema types (the
  source of truth for every content shape), desk structure, content migrations,
  and a `StudioMount` component that takes plain strings (`projectId`,
  `dataset`, `basePath`, `title`), builds the Studio config **internally**, and
  renders it. It is a **package, not a deployed app** — `apps/platform` mounts
  it, so one Studio serves every tenant. Upstream is `config` and `utils` only.
  Nothing may export a _built_ config object out of the package: a Server
  Component calling the builder drags the Sanity SDK into the RSC graph, where
  `swr`, `sanity`'s CSS and `sanity-plugin-media` break under the
  `react-server` condition. See `.claude/agents/studio.md`.
- `@blog/insight` (`packages/insight`) holds the structured logger core —
  `createLogger`, `LOG_LEVEL`, and `sanitizeLogMessage`, its sole canonical
  implementation. It depends on nothing. `apps/web` and `apps/platform` each
  expose one shared logger at `src/utils/logger/logger.ts` carrying their own
  `service` value, and import that rather than calling `createLogger` per
  module. `service`, `db` and `auth` never log — failures reach the caller and
  the app layer logs them once, with request context (the `@blog/db` CLI tools
  above are the one exception). See `.claude/agents/insight.md`.
- `@blog/email` (`packages/email`) is the single home for every email the
  product sends — the shared branded HTML shell, the canonical `escapeHtml`,
  and the typed `sendEmail` Resend transport. Upstream is `utils` only, so both
  apps **and** `@blog/auth` consume it without a cycle. It owns the send call
  but **never logs**, and never resolves tenants or fetches content: callers
  pass it resolved copy and URLs, the way `@blog/ui` takes props, which keeps it
  usable from an Auth.js callback with no request context. Operator-alert copy
  stays hardcoded and must never become tenant-editable. See
  `.claude/agents/email.md`.
- Content shapes come from the generated Sanity types in `@blog/config`
  (`packages/config/src/sanity/generated/types.ts`, produced by typegen) —
  never hand-redeclared.

## Start here for any non-trivial task

Run the **`develop-feature`** skill first. It's the lifecycle playbook —
investigate → plan → delegate each layer → test → review → commit (deploy is
human-gated) — and it says which subagent owns which step. Subagents are not an
automatic pipeline; this skill is how the right ones get used in the right order.

## Planning work — mandatory, not advisory

These are requirements, not guidance: a bundled PR wastes review time and hides
what actually changed.

### Split by workspace, always

**The main workspaces are the unit of work: `studio`, `service`, `ui`, `web`,
`platform`.** Plan every non-trivial task as one chunk per workspace, and ship
one PR per chunk. The supporting packages — `config`, `utils`, `db`, `auth`,
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

- **The user says to stack.** Then, and only then, the chain ships through
  `gh stack` ("Stacked PRs" under Conventions). The orchestrator never chooses
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
  (`develop-feature` §2, template in "Issue body template").
- **Doubts** — including scope you suspect but have not yet confirmed.

**If anything blocks, ask and wait for an answer.** Never proceed on an
assumption, and never absorb newly-discovered scope silently. Discovering
mid-task that a change reaches more workspaces than the ticket said is the
moment to stop and ask — editing the ticket to match what you already built is
backwards.

### Reuse before you create

**Search the whole repo for what already exists before adding a function,
schema type, field helper, constant, type, component, test fake or fixture** —
every app and package, not just the one being changed. A near-duplicate is the
most expensive kind of mistake to find later, because nothing fails — both
versions work.

When something similar already exists and it is not obvious whether to extend
it or add alongside it, that is **not** a judgement call to settle quietly.
Investigate — who calls the existing one, what `SPEC.md` and the agent/skill
docs say, what changing it would break — and if it is still unclear, ask. A
subagent reporting "there was already an X, but I added a new one because…" is
a flag to raise, not a decision to rubber-stamp.

**A second copy moves to a shared folder in the change that would create it.**
When a diff would add code that already exists elsewhere in the repo — a
function, component, hook, fixture or builder — the diff extracts it to its
home and points every call site at it: a component →
`react-component-practices` § Where a component lives; a helper, type or
constant → `.claude/agents/config.md`; fixtures and test setup →
`testing-practices` (a `vi.mock` factory moves at its third copy, not its
second). Writing the second copy "for now" is a blocking review finding,
whoever owns the files it lands in. The layer contracts are the limit:
`apps/web` and `apps/platform` share no code, so a match in the other app is
reported, not extracted.

**Duplication that already existed is filed, not fixed inline.** When a diff
finds two copies that were both on `main` before it and adds no third, the
reviewer files it and the PR ships as is — unless extracting it is the ticket's
own scope. Two parallel sessions extracting the same duplication converge on
the same path _and_ name, because the conventions here determine both, and
collide as an add/add conflict at merge. When a collision happens anyway,
**whatever is on `main` wins and the branch adopts it**, regardless of which
was written first.

### Examine before you change

**Whoever changes a file reads it, and what surrounds it, first** — the
orchestrator writing a ticket, a layer agent implementing one, `test-writer`
adding coverage. Read:

- the whole file you will change, not only the lines the ticket names;
- its callers and what it calls, wherever the change touches a signature or a
  behaviour;
- the other files in its folder, where the same pattern usually repeats.

Read them against this file's Conventions, the layer's own skill, and the
ticket itself. Then sort what you find:

- **Mechanical drift in a file the diff already touches is fixed in the same
  change** — a comment that fails the comment test, a type `@blog/config`
  already exports, a dead import or export, a pattern a later convention
  replaced. This is the steady-state rule comments already follow, applied to
  every convention.
- **Everything else is reported, not fixed** — drift in a file the diff does
  not touch, a behaviour change, a design call. It goes in the agent's
  **Examined** report section with `file:line`. The orchestrator lands it in
  the same branch when it is the same layer and small ("Findings found mid-work
  get fixed in the current work"), and otherwise puts it to the user or files
  it. A diff never grows past its ticket silently.
- **A ticket whose premise the code contradicts stops the work.** A moved line
  reference is corrected without comment; a described behaviour that no longer
  exists, or a fix another PR already made, is reported before anything is
  built on it.

Every implementing agent's report carries a required **Examined** section —
what it read beyond the files it changed, what it fixed in passing, and what it
found and left — so a skipped examination shows up in the report instead of
passing silently.

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
what each package owns is in "Layer contracts" above:

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
  (the `site-preview/` exception is in "Layer contracts").
- **`insight`** is independent, like `utils`. Dispatch it only for the logger
  core itself; a change to how an app _uses_ the logger belongs to
  `web`/`platform-app`.
- **`email`** sits low, upstream of `utils` only. Dispatch it for the email
  templates and transport; a change to _which_ copy a caller passes belongs to
  that caller's layer.

**Delegating in-scope work to its sub-agent is REQUIRED, not optional — for the
whole lifecycle, not just the first draft.** Every file in a sub-agent's domain
(`config`/`studio`/`service`/`ui`/`web`/`db`/`platform-app`/`auth`/`insight`/`email`)
is written, changed, fixed, renamed and reworked **by that sub-agent** — the
initial implementation, every review-remediation, every follow-up tweak, every
"it's one line" edit. The orchestrator _orchestrates_; it does not hand-author
or hand-patch a layer's files because doing it itself feels faster. Handing a
sub-agent pre-written stubs, or editing its files after it hands them back,
both bypass the layer's skill conventions. Describe structure in the prompt;
never write it to disk first. (The one exception is a solo cloud session with
no subagent tooling — "Solo-session mode" under "Ticket priority & triage".)

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
- Step 7 of the delivery gate sequence below (`open-pull-request` Gate 5):
  `gh pr create`, then set the board status — the PR URL isn't reported until
  that board write is confirmed.

Every other dispatch — layer agents, `verify-runner` (including right before
`reviewer`), `reviewer`, `a11y-reviewer`, `seo-auditor`, `ci-watcher`, … —
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

## The `@blog/ui` component index

`packages/ui/COMPONENTS.md` is a generated index of every `@blog/ui` component
— its purpose, props, and compound slots (`Header.Brand`, `PostCard.Media`, …)
— produced by `scripts/gen-ui-index.mjs`. **Consult it before deciding a feature
needs a new UI component:** it's the cheapest way to spot one to reuse or
extend, and the `explore`, `ui` and `web` agents are pointed at it for the same
reason. The pre-commit hook regenerates it on staged `packages/ui` changes, and
`pnpm gen:ui-index:check` guards it in CI — drift, description coverage (every
exported component/slot documented) and structural completeness (no component
silently unindexed). Never hand-edit it; fix the source and regenerate.

## Use the skills

- `develop-feature` at the start of any non-trivial task (lifecycle + delegation).
- `add-content-type` when a change spans more than one workspace.
- `studio-schema-practices` when touching `packages/studio` schemas or migrations.
- `react-component-practices` when writing or changing any React component in
  `packages/ui`, `apps/web` or `apps/platform` — the shared rules the layer
  skills below build on.
- `ui-library-practices` when touching `packages/ui`.
- `web-component-practices` when building or editing an interactive component in
  `apps/web` (popover/menu/disclosure/clipboard/focus) or composing `@blog/ui`
  with client state.
- `platform-ui-practices` when building or changing any UI in `apps/platform`
  — the admin design standard, reusable blocks on Base UI, and the red flags to
  stop on.
- `ui-storybook` / `web-storybook` when adding or editing stories in
  `packages/ui` / `apps/web`.
- `testing-practices` when adding/updating tests.
- `seo-and-metadata` when changing routes, metadata, or feeds.
- `code-review-practices` before every commit — applied by the `reviewer`
  subagent at gate step 4.
- `refactor-sweep` for an on-demand, layer-scoped cleanup audit (duplication,
  dead code, convention drift) — run when asked, naming the layer; it files
  findings as issues rather than editing.
- `open-pull-request` when shipping an issue: branch → work → PR (push and PR
  are human-gated).
- `use-context7` before implementing against any library API, config format or
  CLI flag you are not certain of — live, version-matched docs instead of a
  guess.
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

## Conventions

- **Comments default to zero.** Not "few" — zero. Every comment must survive
  the test below, and most do not.

  **Never comment:**

  - **A property, field, or prop.** The type signature already documents it. A
    prop needing explanation is a naming failure — rename it or restructure
    the type. `image?: false` needing "pass `false` when the kind supplies its
    own image field" should have been `hasOwnImage?: boolean`.
  - **A key/value constant.** The name is the meaning and the values are the
    vocabulary. `packages/config/src/constants/cta.ts` is the model: zero
    comments, perfectly readable.
  - **Anything inside a function body** narrating what a line, branch or step
    does. If that feels necessary, restructure or rename instead.
  - **A contract that holds at more than one call site.** It belongs at the
    contract's definition, stated once — never restated where it is used.
  - **Project-management state**: a `docs/superpowers/specs/*` or `plans/*`
    path, a roadmap phase, a `§4.2`-style section reference, an issue or PR
    number as narrative, or a "not wired up yet" note. Each is guaranteed to
    become false; it belongs in the PR description, dated and discoverable via
    `git blame`. The one exception is a `TODO:`/`FIXME:`, which may cite an
    issue number, in its own comment block — it points at open work.
  - **The history or mechanism of a change.** State what is true now, not how
    it came to be true — a comment that reads like a commit message is this
    mistake.
  - **A shared component's purpose tied to its first consumer.** `ActionGroup`
    is general-purpose, but its doc comment described "a CTA module's actions"
    — CTA is its first caller, not its scope. Describe the general contract.
  - **Anything the name and signature already say.** "HeroProfileModule —
    fetches module_heroProfile data and hands it to HeroProfileModuleView" is
    the name, the return type and the one import, read back as prose. The
    `Name — does X` form is banned outright, as are "pure view for X", "the
    web-side wiring for X" and "renders nothing when …". **The test: if the
    comment could be regenerated from the name, the parameter names and the
    return type, delete it.** Agents produce this pattern most.
  - **A sibling's comment.** "Model on the nearest sibling" means its structure
    and naming, never its comments — a sibling's doc block is drift to delete,
    not a template to copy.

  **The only comments allowed:**

  1. **One line for a tuned value or a real gotcha** — something a competent
     reader would otherwise get wrong. A magic number's rationale, or a
     constraint the code cannot express (Next's route segment config requires
     a literal, so no route can import `CONTENT_ROUTE_REVALIDATE_SECONDS`).
  2. **A doc comment only where the name genuinely cannot carry the purpose**
     — one sentence, saying what it is _for_, above the export and nowhere
     else. A descriptive name gets none, and a name that needs a sentence is
     usually the thing to fix. Never how it works or which arguments or props
     it reads — the signature documents that.

  **The test, when you believe you have an exception — ask in order:**

  1. Would a competent developer reading only the code get this wrong? If no,
     delete it.
  2. Could renaming or restructuring stop them getting it wrong? If yes, do
     that instead.
  3. Does this same fact hold at other call sites? If yes, it belongs at the
     definition, not here.

  Only what survives all three earns a comment.

  **This rule overrides "write code that reads like the surrounding code".**
  The repo's existing comment density is the drift being corrected, not the
  standard to match. **When you touch a file, delete the comments in it that
  fail the test — do not shorten them**; trimming is only for a comment that
  earns its place but runs long. Converging file by file is the steady-state
  mechanism, and it never collides with an open PR.

- All workspace source files live under `src/` within each package/app.
  Exceptions: root-level config files required by their tool
  (`sanity.config.ts`, `sanity.cli.ts`, `next.config.ts`, `vitest.config.ts`,
  etc.) stay at the package root.
- **Absolute imports via per-workspace aliases.** Internal imports use the
  workspace's **own name** as the alias — `@blog/{pkg}/*` for packages
  (`@blog/config`, `@blog/service`, `@blog/ui`), `@{app}/*` for apps (`@web/*`,
  `@platform/*`). Same-directory `./` stays relative; **never**
  parent-traversal `../`, and **never** a shared `#/`/`@/` (a shared prefix
  hijacks a dependency's identically-named alias across packages, and breaks
  the Turbopack build / cross-package type-check). Each workspace's
  `tsconfig.json` `paths` **and** `vitest.config.ts` alias declare its own
  alias **plus each dependency's** alias (e.g. `web` maps `@web`, `@blog/ui`,
  `@blog/service`, `@blog/config`). **When a workspace starts consuming a new
  package, add that dependency's alias to the consumer's `tsconfig` +
  `vitest`** — otherwise type-check/test/build fail. Unique per-workspace
  prefixes resolve cleanly in tsc (`Bundler`), Next/Turbopack, Sanity's esbuild
  extract, and vitest.
- TypeScript `strict`; no `any`. Server Components by default.
- **Use `@blog/config`'s shared types; never spell one out by hand.** Write
  `TMaybeUndefined<T>`, never `T | undefined`; `TMaybeNull<T>`, never
  `T | null`; `TNullable<T>`, never `T | null | undefined` — in a prop, a
  return type, a `useState` or a `createContext` alike. Derive a const's union
  with `TValueOf<typeof C>` (`@blog/config/utils`), never
  `(typeof C)[keyof typeof C]`. The same goes for `IWithClassName`,
  `IWithDataTestId`, `ILocalizedParams` and `ITenantLocalizedParams`. Before
  writing a type, check `packages/config/src/types/` for one that already says
  it, and add a missing one there rather than locally. Exempt are the
  generated Sanity types and the workspaces below `@blog/config` in the graph,
  which cannot import it: `@blog/utils`, `@blog/insight` and `@blog/email`. The
  raw forms already in the repo are converted file by file as each file is
  touched, the same steady-state rule as comments. Where helpers and shared
  constants live: `.claude/agents/config.md`.
- **File size budgets, in non-blank lines:** a component `.tsx` 150, a hook
  120, any other `.ts` 120. Exempt: `*-variants` files, registries and
  catalogs (`icon-registry.ts`), Studio schema definitions, generated files,
  tests and stories. A diff that touches an over-budget file extracts the part
  it changes — not the whole file, and never as a sweep. Where the extracted
  part goes in a React workspace: `react-component-practices` § Size and
  splitting.
- **Function style is decided per layer kind, and enforced by ESLint per
  workspace.** React layers export _values_ — a component is a const holding a
  function — so they use **arrow-function consts**
  (`func-style: ['error', 'expression', { allowArrowFunctions: true }]`).
  `@blog/service`, `@blog/db` and `@blog/email` export _operations_, where
  `export function getPostBySlug()` is the ordinary Node/TypeScript idiom, so
  they keep **declarations**. Wired in `configs/eslint/`: `web.js`,
  `platform.js` and `studio.js` (arrow); `service.js`, `db.js` and `email.js`
  (declaration). `packages/ui` is arrow but not yet enforced — don't read that
  as licence to drift. The exceptions and the Next.js reserved-export
  carve-out: `.claude/agents/web.md` / `platform-app.md` § "Function style".
- **Key/value-pair consts are always both UPPERCASE** (key === uppercase
  value), `as const`, and live in `@blog/config` (`constants/`). e.g.
  `export const LINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;`
  The uppercase value is the stored/serialized value, so schema `options.list`
  and migrations use it too; derive unions with `TValueOf<typeof C>`. Shape
  and casing never change; two exceptions move only the home, both decided by
  who reads the const — and a const a package reads never lives in an app:

  - **An app's own vocabulary lives in that app.** A const read by exactly one
    app and by no package lives in that app's `src/constants/`, one domain per
    file, imported through the app's alias (`@platform/constants/preview` — the
    preview mode and width only its preview frames read). The day a second
    workspace needs one, it moves to `@blog/config` in the change that adds
    that reader.
  - **A storage layer's own vocabulary lives with that layer** — a const whose
    values that layer persists, read _only_ by that layer and the app on top of
    it; "only one app happens to use it today" is not enough. `@blog/db` owns
    `TENANT_STATUS`, `TENANT_PLAN`, `MEMBERSHIP_ROLE`, `ADMIN_ROLE`,
    `GRANTED_VIA` and `TENANT_PROVISIONING_*` on that basis.

  **Reach is the test — not how the column is typed.** Those six are stored as
  a `pgEnum`, plain `text().$type<>()` and a `jsonb` map alike.
  `PRESET_ID` / `FONT_CHOICE` / `RADIUS_SCALE` / `DENSITY` back `pgEnum`
  columns in `site-config.ts` yet stay in `@blog/config`, because both apps
  read all four and `packages/studio` reads `PRESET_ID`.
  **`AUDIT_ACTION` / `AUDIT_TARGET_TYPE` deliberately stay in `@blog/config`**
  although only `db` and `apps/platform` read them: auditing is cross-cutting,
  its vocabulary grows as surfaces become auditable, and `audit_events` stores
  both as plain text so a new action needs no schema change — don't relocate
  them. Where a const _does_ back a `pgEnum`, it and its column move together:
  `Object.values(…)` builds the enum's value list, so reordering the const
  silently reorders a Postgres enum — confirm with `db:generate` that no
  migration appears.

- `'use client'` never in `@blog/ui` (it stays pure and prop-driven). Two
  components there, `Carousel` and `Dialog`, are nonetheless client-only —
  they own client hooks (`useEmblaCarousel`, Base UI's dialog) — and carry no
  directive: the consumer declares the boundary, the way `sanity-image`'s
  `SanityImage` works. The one package that may carry it is `@blog/studio`,
  whose mount component is irreducibly client-side; that exception is scoped
  to that component and does not license the directive anywhere else in
  `packages/*`. In `apps/web` it IS the right
  tool — add it at the _leaf boundary_ that genuinely needs the client: React
  hooks (`useState`/`useEffect`), browser APIs, event handlers, or wrapping a
  third-party component that uses hooks internally (e.g. the `sanity-image`
  wrapper). Keep it as low in the tree as possible, not on whole pages.
- **Destructure a value into local bindings once, right after the point that
  settles its shape — then use those bindings, not repeated inline access.**
  Whenever a function reads more than one field of an object more than once —
  a fetched `service` result past its null/`notFound` guard, a props object, a
  parsed config — destructure it once near the top of the scope where the
  shape is settled, and never repeat `result.data.x`/`post.x`/`props.x` inline
  at each use site. Canonical case: a page/route component destructures its
  fetched result right after the guard
  (`const { title, posts, currentPage, totalPages } = result.data;`).
- **No bare `console.*` — log through the app's shared logger** (see the
  `@blog/insight` contract above; dropping it loses the `service` field that
  separates the two apps' lines). `no-console` is declared in
  `configs/eslint/base.js`, which exempts tests; each other exemption — the
  logger itself, `@blog/db`'s `scripts/**` and `drizzle.config.ts`,
  `apps/web`'s `e2e/**`, places where stdout _is_ the interface — lives in that
  workspace's preset, because flat-config `files` globs resolve per consuming
  workspace. Event names are static, lowercase and dot-namespaced; dynamic
  values go in the context object, never into the name. **Log the gap between
  what the user was told and what actually happened — no gap, no log:** a
  specific, self-correctable message (a validation error, a duplicate slug) is
  the whole truth and needs no line, while a deliberately vague one hides the
  cause and must be logged. A `TResult` failure is not automatically an
  `error` — branch on the `ERROR_CODE` and log only what a human would act on.
  Full contract: `SPEC.md` §17.
- Co-locate `*.test.ts(x)`; `pnpm test` must pass. A test file carries no
  comments at all — its `describe`/`it` titles are the documentation
  (`testing-practices` → "What not to test"). Test setup — `beforeEach`, render
  helpers, `__mocks__/`, fixture builders — follows `testing-practices`.
- **Never assert the source back at itself** — a field or option list, a
  default, editor-facing copy, a `??` precedence, or a Tailwind class,
  prop-driven or not (the `no-class-assertions` lint rule fails it): the
  expected value is a literal copied from the file under test. A styling-only
  change gets a story and `no-tests-needed`, never a test. Never drop to a raw
  DOM query — a roleless element gets a fixed `data-testid` and
  `screen.getByTestId`. A Studio schema definition gets no test at all. One
  rule, one home: `testing-practices` → "What not to test" and "Never drop to
  a raw DOM query".
- After a schema change: `pnpm typegen`, then commit the regenerated files in
  `packages/config/src/sanity/generated/`. Typegen can be non-deterministic —
  re-run until the diff is minimal.
- **Never hand-edit the generated types.**
  `packages/config/src/sanity/generated/` is deny-listed for
  Edit/MultiEdit/Write in `.claude/settings.json`. That is not an obstacle to
  route around: a shell write (`echo >`, `sed -i`) is not blocked but is still
  wrong — the next `pnpm typegen` silently undoes it and CI's typegen drift
  guard catches it. If a generated type is wrong, the **schema** in
  `packages/studio` is wrong — fix it there and regenerate.
- **Check for migrations.** Content is live in the `production` dataset, so any
  change that alters an _existing_ shape — renaming/removing/moving a field,
  renaming a `_type`, restructuring a document — orphans data unless existing
  documents are migrated. Before implementing, decide: does this need a data
  migration? If yes, **surface a migration plan and prompt the user** (which
  documents/fields change, the `sanity/migrate` transform, dry-run → backup →
  human-gated run) — do not just change the schema. Additive, optional-only
  changes need no migration; say so explicitly. Use the tooling and workflow in
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
- Verify with `pnpm verify` from root — one `&&` chain over `type-check`,
  `lint`, `test`, `knip` and the five gating scripts (`check:client-graph`,
  `check:revalidate-tags-sync`, `check:turbo-env-sync`,
  `check:migration-index`, `gen:ui-index:check`), so it stops at the first
  failure and mirrors every required or gating CI check that has a local
  equivalent (`docs/context/ci-automation.md` maps them). `pnpm build` is not
  part of the local loop — CI's `ci.yml` `build` job gates every PR; reproduce
  it locally only when diagnosing an actual CI build failure
  (`open-pull-request` Gate 5a).
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
  nothing. Full contract: `open-pull-request` § "PR body template".
- **Per-layer PRs are required** ("Planning work — mandatory, not advisory"
  governs). **Only the completing PR includes `Closes #<n>`** — earlier layer
  PRs reference the issue without an adjacent closing keyword, because GitHub
  auto-closes on the literal substring regardless of tense. Exact wording rule
  and the board-Status gotcha when an issue is auto-closed early:
  `open-pull-request` § "Scope: prefer per-layer PRs" and "PR body template".
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
  `open-pull-request` § "Stacked PRs".

- **Spec sync:** a PR that changes architecture, layer contracts, data flow,
  env vars or a cross-cutting rule updates `SPEC.md` — the architecture core —
  in the same PR. A content-model change updates its feature page, plus any
  `SPEC.md` §6 entry that still describes that shape.
- **Feature docs:** `docs/features/<feature>.md` is the per-feature reference —
  what it does, surfaces and routes, data (Sanity documents, Neon tables),
  configuration and plan gating, constraints and invariants, dependencies,
  entry points, tests and stories, related epics. A PR that changes a
  feature's behaviour updates its page in the same PR; a feature with no page
  yet gets one when a PR first changes it — on touch, never as a sweep. Every
  ticket's `## Scope` carries a `Feature doc:` line.
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

## Reporting to the user

**Default shape of a chat message: the outcome first, then at most a handful of
lines.** Roughly 8 lines of prose is the budget for a routine status update; a
genuinely complex decision can run longer, but it has to earn every line past
that. The progress table the user asks for after each unit of work is exempt —
it is the requested format, not prose.

**Six things bloat these messages. None of them are information the user
lacks:**

- **Restating a subagent's report.** The orchestrator's job is the
  _conclusion_ — "#2987 landed, service green" — not a prose retelling of what
  the agent said it did.
- **Verification statistics.** "135 files / 730 tests, type-check green across
  all 11 tasks" is one word to the reader: green. Give numbers only when
  something failed, or when the user asked for them.
- **Narrating abandoned paths and internal reasoning.** Work the user never
  sees and cannot act on. Report the state that exists now.
- **Self-assessment and blame attribution.** "That came from my dispatch",
  "that's the right behaviour" — the user needs the decision, not a review of
  how it arose.
- **Repeating unchanged state.** Board status, epic counts and remaining
  sub-issue lists get one mention when they _change_.
- **Bundling an unrelated ask into a status update.** A stray "also, should I
  delete this label?" buried under a report gets missed or derails the thread.
  Hold it, or ask it on its own.

### Reporting epic status

**One format answers both triggers** — a PR on a tracked epic merging, and the
user asking where an epic stands ("epic status", "where are we on #2943?",
"what's left"). Same table either way; the opening sentence names the merge
when there was one and is dropped when there wasn't.

**The report is exactly:** that sentence, then **one table** carrying every
open ticket in the epic, grouped into three lanes by a band row. Nothing else —
no board recap, no verification statistics, no retelling of the `board-keeper`
report. Before answering a status question, dispatch `board-keeper` first
("Board reconciliation" below) so the table is built from a reconciled board.

```
#2975 merged — the home page can now open with a heading instead of a hero.

| #                    | What                                | Scope                  | Note                         |
| -------------------- | ----------------------------------- | ---------------------- | ---------------------------- |
| 🟢 **Done**          |                                     |                        |                              |
| 2975                 | home page — headingSettings         | web                    | merged in #3001              |
| 🟡 **Parallel now**  |                                     |                        |                              |
| 2976                 | landing page                        | web                    | `landing-page-view`          |
| 2977                 | blog list page                      | web                    | `blog-list-page`             |
| 2960                 | retire `blog_post`                  | studio                 | + seed migration             |
| 🔵 **Next, in order**|                                     |                        |                              |
| 2969                 | retire `BlogPageTemplate` props     | web                    | ⛓ stack on 2977              |
| 2988                 | rename `sectionHeader`              | studio + service + web | sequential — reds type-check |
```

**Mark a 🔵 row `⛓ stack on <#>` when it can ride a `gh stack` on the row above
it.** Dependency alone does not make a chain stackable: the **bottom** PR must
be green on `main` alone ("Stacked PRs"), so 2988 above — a rename that reds
`type-check` until every consumer lands — is unmarked. A `⛓` is a compile
claim, and an offer to the user, not a plan: marked or not, a 🔵 row ships
sequentially unless the user says to stack it.

**Lane order is fixed: 🟢 done, 🟡 parallel now, 🔵 next in order** — the
actionable lane above the queue behind it, and within 🔵 a blocker above what it
blocks. **The `Scope` column makes the 🟡 lane checkable:** tickets scoped `web`
are parallel-safe only as separate files, so a 🟡 lane whose rows share a scope
_and_ a file is a bug in the report. **Every dependency claim is derived** from
what the tickets touch — a shared file, a renamed symbol, a consumed type — never
from issue-number order; when unclear, say they are unordered, because a wrong
"blocks" sends a parallel dispatch into a collision.

**The three markers are the colour — never substitute other emoji.** Terminal
markdown renders no colour, ANSI escapes or HTML, so a band row is a normal row
with its label in the first cell and the rest empty (`<td colspan>` renders as
literal tags). Solid discs, not pictographs: a glyph like `🔜` all but vanishes
on a dark terminal, while one shape in three saturated hues reads the same on
any background.

**This table _is_ the progress table** the user asks for after each unit of
work. Regenerate it live from `gh` every time — a pasted snapshot from an
earlier turn is exactly the staleness it exists to prevent.

### Asking the user a question

**When a decision genuinely needs the user, ask it as a question — not as a
brief.** State the recommendation first, then the single fact that could change
it, then the question:

```
I'd apply it to all five call sites — the other four are byte-identical and
behaviour-preserving. Cost is four extra files on a prio:later ticket.
All five, or home only?
```

This does not license withholding a real tension — surfacing one stays
mandatory ("Mid-task decisions" above). It governs the _length_ of the
surfacing, not whether it happens.

**One question per message.** If two decisions are pending, ask the blocking
one and hold the other until it is answered.

**Every question carries an urgency glyph**, because a question and a status
line look identical once they scroll past:

- 🟥 **Blocking** — work has stopped; nothing proceeds until the user answers.
- 🟧 **Needed soon** — work continues on a stated assumption that costs rework
  if it turns out wrong.
- ⬜ **Whenever** — a preference or a tidy-up; answering late costs nothing.

Squares, not the status lanes' discs, so the two systems never blur at terminal
size; red and orange are unused by the lanes. **🟥 means work actually stops.**
If the work carried on regardless, the question was not blocking — label it 🟧
and name the assumption.

### An open question is carried, not dropped

A question asked once and then buried under later messages lets work continue
on an assumption the user never confirmed, with nothing on screen showing it is
outstanding. So until it is answered:

- **Restate it as the last line of every message**, in one line, with its
  glyph — the last line is what sits directly above the user's input box.
- **Never resolve it by picking the best option.** A reply that addresses
  something else is not an answer; it stays open and stays carried.
- **If work continued past it, say what was assumed** in that same
  restatement, and whether the assumption is still cheap to reverse.
- **Drop the carry line only when the user actually answers it**, or
  explicitly waves it away — not on a topic change, a new instruction, or the
  question becoming awkward to repeat.

## Delivery gate sequence (mandatory — never skip or bundle)

Every issue follows this exact order. **Committing is free (no approval
needed); stop and wait for explicit user approval at the push and PR gates.**
(In a solo cloud session, steps 1 and 7's board writes and step 4's `reviewer`
dispatch are replaced as "Solo-session mode" describes — every other step,
including both approval gates, is unchanged.)

1. Set issue → In Progress on the board
2. Checkout branch from `main`
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
   change duplicates a decision into (a feature page, `docs/BACKLOG.md`, an
   epic body). State in the push ask that the diff was docs-only and
   identifier-checked.

5. **Commit** the reviewed work — no approval needed; committing is free (local
   and reversible). Don't push it yet.
6. **Ask to push** — explicit approval required; separate question; wait for
   answer.
7. **Ask to open PR** — separate question, after push; wait for answer. Once
   approved: run `gh pr create`, then **immediately** set the issue → Code
   Review on the board — do not report the PR URL until that update is done —
   and tag the PR `job:<session-name>` so concurrent background jobs stay
   tellable apart in the PR list: the session's slugified **name**, never its
   id (`job:static-generation`, not `job:ab922b91`), skipped silently in a
   foreground session and never applied in a cloud one (mechanics, including a
   renamed session: `open-pull-request` Gate 5). The label identifies the job,
   not the author — PRs are always opened by the orchestrator, never a
   subagent. Then dispatch `ci-watcher` (background) to watch CI to completion,
   and diagnose and fix any failure it reports (`open-pull-request` Gate 5a) —
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
For an epic's PR, the user gets the table in "Reporting epic status", never a
retelling of the report.

**Never call `gh issue create` directly — creating an issue always goes through
`board-keeper`.** Dispatch it with
`"create issue: title=..., body=..., labels=...(, parent=#<n>)"`; it creates the
issue, places it on the board, confirms status and labels, links any parent,
and only then reports the number — one verified operation. Gather every field
first — **title** (conventional-commit style), **body** (the template below),
**labels including exactly one `prio:*`**, and the **parent issue number** for
a sub-issue — asking the human for anything missing, since `board-keeper`
cannot prompt. In the same pass, add `cloud-ok` when the ticket qualifies.

**Read the body against the skills before dispatching it.** A ticket body is
the whole brief for whoever executes it — a cloud session has no reviewer, and
a layer agent's prompt is sourced from it — so anything it prescribes that a
skill forbids ships exactly as written. Check every `## Scope` line and
criterion against `testing-practices` → "What not to test" and "Comments
default to zero":

- **Acceptance criteria state behaviour, never a test's shape.** "Two labels
  render the same minimum width from `sm` up" is a criterion;
  "`action-group.test.tsx` — the classes per appearance" is an instruction to
  write the class assertion `testing-practices` bans, and a cloud session will
  write it.
- **A styling-only change says so.** Spacing, sizing, tokens, borders and
  layout have no unit-test surface: the body names the story that covers the
  change, `## Scope` lists no test file, and the ticket carries
  `no-tests-needed` from creation.
- **The same check covers every other rule** a body can quietly prescribe: any
  test of a Studio schema definition, a test that asserts a constant's value
  back at itself, a `Name — does X` doc block, a hand-edit to
  `packages/config/src/sanity/generated/`, a schema change with no migration
  decision.

A body that fails this check is rewritten before dispatch — never dispatched
and corrected in review.

### Issue body template

**An issue body is a work item in fixed sections, not a design document.** A
ticket says why the work exists, what "done" means, and where the design lives
— the design itself belongs in a `docs/superpowers/specs/*` doc while the work
is in flight, and in its `docs/features/` page once it ships.

A sub-issue (other than a manual-test issue, below), in this order and no other
sections:

```
## Why
<1–3 sentences: what is wrong or missing today>

## Scope
- <layer>: <what changes>
- Feature doc: docs/features/<feature>.md (update | create | none)

## Acceptance criteria
- [ ] <observable outcome, not an implementation step>

## Verify
pnpm verify

## Design
<link to the spec doc, or "none — the criteria above are the whole design">
```

An epic swaps `Acceptance criteria` and `Verify` for the shape of the work,
since its sub-issues carry those:

```
## Why
## Shape        — the rule the epic establishes, ≤5 bullets
## Order        — what blocks what, and what can run in parallel
## Done when    — the feature pages (and any SPEC.md core sections) the final PR must update
## Design       — link to the spec doc
```

`## Order` is the same information the epic status table renders as its 🟡 and
🔵 lanes; writing it into the epic once is what lets that table be regenerated
rather than re-derived.

A manual-test issue — owed by any change that alters what a page shows or how
it behaves, labelled `manual-test` plus the same `prio:*` as its
implementation (when it is filed, linked and closed: `develop-feature` §2):

```
## What changed (user-visible)
<what a reader, editor or operator now sees or does differently>

## Seed
<exact Sanity documents and fields to create or edit, per tenant and locale;
platform settings, capability toggles and plan — or the seed command>

## Steps
1. <action> — expected: <one observable result>

## Matrix
- Viewports 390, 820, 1280; light and dark
- Brand variants PRIMARY / SECONDARY / BRAND_PRIMARY, where a module is involved
- Locales; signed in and out; Free and Growth, where plan-gated

## Validation
<invalid input, empty states, limits, error copy>

## Regression watch
<shared components and other modules/pages using what changed;
caching/revalidation; SEO>

## Accessibility
<keyboard path, focus, accessible names, contrast>
```

**Never put these in an issue body:**

- **A roll-up of sibling issues** — "Shipped: #2944, #2945, …". GitHub renders
  the sub-issue list natively with live state; a hand-written copy is stale the
  day the next one merges.
- **The design narrative** — field-order tables, migration transcripts,
  per-component walkthroughs, the reasoning behind a shape. That is the spec
  doc's job, and the feature page's afterwards.
- **Progress edits.** A body is written once. Status lives on the board, in the
  sub-issue list, and in the PRs; editing the body to record what has landed
  turns the ticket into a changelog.

A `cloud-ok` ticket keeps its exact file list and verification command, because
those are `## Scope` and `## Verify`; what it drops is the design narrative,
which a cloud session does not need to execute the criteria.

**A feature spanning 2+ layers always gets an epic (parent) issue plus one
sub-issue per layer — never a single flat issue covering multiple layers.**
Ticket structure informs PR structure, not the other way around. Gather every
sub-issue's title/body/labels up front, then dispatch `board-keeper` once with
the whole set — it creates the epic first, then each sub-issue with
`parent=<epic-number>`, in one batch.

## Ticket priority & triage

**Every open issue carries exactly one `prio:*` label**, set at creation
(`board-keeper` rejects a creation dispatch without one):

- `prio:now` — blocks users (a live bug) or blocks the active epic. Work this
  first, always.
- `prio:next` — on the active feature path: the current epic's sub-issues, or
  the next epic queued behind it.
- `prio:later` — real, agreed work with no schedule. Pulled deliberately (e.g.
  a cleanup-batch PR, a cloud-agent session), never by default.
- `prio:someday` — an idea or speculative cleanup; no commitment implied.
  Supersedes the old `deferred` label, which older issues keep alongside it —
  don't churn them.

**The pull rule:** work comes from `prio:now`, then the active epic's
`prio:next` — never from `later`/`someday` unless the human explicitly asks for
a cleanup pass. A growing `prio:later` pile is healthy (it's a backlog, not a
queue); a growing `prio:now` pile is the signal to stop and re-triage.

**Findings found mid-work get fixed in the current work, not ticketed.** A
reviewer finding, lint nit or small cleanup that touches the current branch's
layers goes to the owning layer agent and lands in the same branch/PR. Filing a
ticket is the fallback, for findings genuinely out of scope: a different layer,
a design decision, or a change big enough to need its own review. Ticketed
findings default to `prio:later` (`prio:someday` if speculative); one earns
`prio:now`/`prio:next` only as a user-facing bug or a blocker of a planned
feature, and the creating dispatch must say which — otherwise every unit of
work mints tickets that crowd out feature work.

**`cloud-ok` marks a ticket safe to hand to a solo cloud agent session**
(single context, no local multi-agent tooling). A ticket qualifies only when it
is all of:

- **single-layer** — one workspace, one owning agent's domain;
- **self-contained** — the body alone carries exact files, acceptance criteria
  and the verification command, `pnpm verify` (not a scoped
  type-check/lint/test: a cloud session has no `gh` and cannot see a red check
  after it pushes, and every gate `pnpm verify` chains runs locally). The
  CI-only tail — `build`, typegen drift, workflow linters, CodeQL, Dependency
  Review, Document validation, Migrations, Vercel — stays a local session's to
  watch after a cloud agent opens a PR;
- **free of human gates** — no Sanity or Drizzle migration, no console config,
  no production-dataset touch;
- **small** — roughly ≤5 files touched;
- **outside `.claude/**`** — the GitHub Actions `@claude` runner refuses every
  `Edit`/`Write` under `.claude/` as a sensitive path, independently of
  `.claude/settings.json`, so such a ticket runs to completion and delivers
  nothing there. Root `CLAUDE.md` and `docs/**` are writable; a ticket whose
  scope names an agent, skill or hook file is a local ticket.

**Solo-session mode.** A single cloud session — a Claude Code web/remote
session (`board-keeper.md`'s preflight), with no parallel local jobs and no
worktree/scratchpad tooling — replaces exactly three things; everything else,
including quality gates, conventional commits and the push/PR approval gates,
still applies:

- **Delegation is relaxed:** implement directly, reading the owning layer's
  `.claude/agents/<layer>.md` first; step 4's `reviewer` dispatch becomes a
  self-review against the `code-review-practices` checklist before committing.
- **Board writes** (steps 1 and 7) are replaced by the evidence protocol below.
- **The `job:<session-name>` PR label** does not apply and has no substitute —
  it tells concurrent local jobs apart, and a cloud session has no job id and
  no `gh`. Never reach for an MCP or REST equivalent.

**Cloud sessions never write the project board — they leave evidence it can be
inferred from.** Projects v2 is GraphQL-only, and cloud sessions have no `gh`
and that API blocked, so never attempt `gh project item-edit` or an equivalent.
Signal status the way the board tooling reads it (`board-keeper.md` Step 3):

- **Starting:** comment on the issue ("starting work in a cloud session"), then
  rename the branch before the first push. A web/remote session starts on a
  generated name like `claude/optimistic-noether-isuljn`, which carries no
  issue number; rename it to `<type>/<n>-<slug>`, the slug from the ticket
  title (`git branch -m feat/3952-team-single-member` for "feat(studio): a Team
  may have a single member"). A pushed branch with that name is the In
  Progress signal. The GitHub Actions `@claude` path can't rename:
  `claude-code-action` generates `claude/issue-<n>-<timestamp>`, which
  `board-keeper.md` Step 2 also reads as In Progress.
- **In review:** open the PR with the issue reference (`Closes #n` on the
  completing PR only) — an open PR is the Code Review signal. On the `@claude`
  path, `claude.yml`'s `--append-system-prompt` tells every run to push and
  open its own PR via `gh pr create`; if a "Create PR" link appears instead,
  `gh pr create --head <branch>` opens one from the pushed branch without a
  checkout.
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
  commands directly ("Don't" below).

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

## Don't

- Run `sanity deploy` / Vercel deploys by hand (the pipeline owns them; console
  setup is human-gated) — this includes the `vercel` plugin's `/deploy`
  command, `deployment-expert` subagent, and `deploy_to_vercel` MCP tool;
  `.claude/settings.json` denies the underlying `vercel --prod` /
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
  (Committing needs no approval — commit freely as work reaches a coherent
  state.)
