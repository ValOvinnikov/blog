# CLAUDE.md

Guidance for working in this repo. `SPEC.md` is the architecture core — layer
contracts, data flow, cross-cutting rules — and `docs/features/<feature>.md` is
the per-feature reference ("Docs move with the code" under Conventions). Open work lives on
the project board ("Ticket priority & triage"); `docs/ROADMAP.md` is the order
the open epics ship in. `docs/archive/` is frozen history — never read it for
current behaviour; when it disagrees with `SPEC.md`, the spec wins.

## What this is

A Turborepo + pnpm monorepo for a headless-CMS blog. Sanity Studio (v6) authors
content; a Next.js 16 App Router site renders it; types flow end-to-end.

## Layer contracts (do not violate)

```
web → ui, service, db, auth, config, utils, insight, email
platform → db, auth, config, utils, insight, email, studio
worker → db, config, utils, insight, email, @sanity/client (imported by nothing)
service → config, utils (no React)          studio → config, utils (typegen source)
ui → config, utils (no Sanity/fetch)        configs/* → consumed by all
db → config, utils (no React/Sanity)        auth → db, config, utils, email
config → utils (OKLCH maths behind the shared contrast guard)
email → utils (sits low; the apps and auth consume it)
insight → nothing (base of graph)           utils → nothing (base of graph)
graph is acyclic
```

- `@blog/ui` is pure and prop-driven — never imports `service`/`sanity`/`fetch`.
- `@blog/service` is the only request-path package importing the Sanity SDKs;
  never imports React. (`@blog/studio` is the Studio and schema owner;
  `@blog/db`'s provisioning exception and `apps/worker` are below.)
- `@blog/db` is the only package importing the Neon/Drizzle SDKs — Postgres
  data: Auth.js users and sessions, tenants and their domains, memberships and
  invites, admins, site config, feature toggles, email config and templates,
  subscribers, bookmarks, contact-form leads, magic-link send counters, audit
  events and findings (comments and ratings are planned; no tables exist yet). It never imports React or `@blog/service`
  (siblings, not dependents — `.claude/agents/db.md`), and is **imported only
  by the three apps (`web`, `platform`, `worker`) and `@blog/auth`**, which
  binds the Auth.js adapter to its tables. It imports no Sanity SDK, and its `src/` never imports
  `@blog/insight` — logging is the apps' job. One scoped exception, in
  standalone CLI tools outside the request path (`SPEC.md` §4): four tools —
  `deprovision-tenant/`, `recheck-tenant-owners/`,
  `validate-tenant-documents/` and `migrate-tenant-content/` — import
  `sanitizeLogMessage` directly rather than keep a drifted copy.
- `apps/web` is the only place `ui` and `service` (and `db`) meet (Server
  Components fetch, pass typed props to `ui`).
- `@blog/auth` holds the Auth.js configuration both apps pass to their own
  `NextAuth()` call — providers, the Drizzle adapter, session strategy, cookie
  options. It sits above `db` (which owns the adapter tables) and **`db` must
  never import it**. One shared builder, never a shared session: two
  independently maintained configs drift silently, so both apps build from
  `buildAuthConfig(app)`, and each app names its own cookies and reads another
  app's session as no session. See `.claude/agents/auth.md`.
- `apps/platform` is a separate Next.js app (its own deployment and domain) for
  the operator/tenant admin panel — it consumes `db`, `auth`, `config`, `utils`,
  `insight`, `email` and `@blog/studio`, and **never Sanity or `@blog/service` directly**: it
  reaches the Studio only through `@blog/studio`'s mount component, and ESLint
  `no-restricted-imports` bans `sanity`, `next-sanity`, `@sanity/*`, `groqd`
  and `@blog/service` there. It owns its presentational primitives (Text, Card,
  Icon, Button, …) as well as its interactive ones, built on Base UI and styled
  in-app; nothing is added to `@blog/ui` for it. The one exception is
  `apps/platform/src/components/features/site-preview/`, which renders the
  tenant's real site with `@blog/ui` so the live theme preview cannot drift
  from `apps/web` — an ESLint guard confines `@blog/ui` imports under
  `apps/platform` to that directory. See `.claude/agents/platform-app.md`.
- `apps/worker` is a third, non-public app (its own Vercel project) that runs
  tenant provisioning as Vercel Workflow durable runs, enqueued by
  `apps/platform` with a shared secret. It consumes `db`, `config`, `utils`,
  `insight`, `email` and `@sanity/client` — a third importer of `@blog/db`
  and, off the request path, of a Sanity SDK — and **nothing imports it**. It
  never imports React, `@blog/ui`, `@blog/service`, `@blog/auth` or
  `@blog/studio`, and it alone holds the provisioning secrets
  (`SANITY_MANAGEMENT_TOKEN`, `TENANT_TOKEN_ENCRYPTION_KEY`, the registry
  `DATABASE_URL`, `SANITY_REVALIDATE_SECRET`, `VERCEL_TOKEN`). See
  `.claude/agents/worker.md`.
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
  implementation. It depends on nothing. The logger may ship its `error` and
  `warn` lines to sinks registered at runtime (`registerLogSink`; the
  `fetch`-only `createLokiSink` is the one it provides); a sink never throws
  into the logging call and its failures are never logged. `apps/web` and `apps/platform` each
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

One PR per main workspace and per adopting surface, in dependency order, each
merged before the next starts. Combine layers only when the earlier PR would
not merge green on `main` alone (a rename every consumer reads); stack only
when the user says to. Put the split and what it touches to the user before
the first dispatch. **If anything blocks, ask and wait**; never absorb new
scope silently. Full rules: `develop-feature` § "Planning work".

## Reuse before you create

**Search the whole repo for what already exists before adding a function,
schema type, field helper, constant, type, component, test fake or fixture** —
every app and package, not just the one being changed. A near-duplicate is the
most expensive kind of mistake to find later, because nothing fails — both
versions work. No check catches a value or fixture repeated across files, so
the search is the gate: every implementing agent reports it in a required
**Reuse** item — for each const, literal value, fixture, builder, fake or
helper the diff adds, where it looked (`packages/config/const-index.json`,
`packages/utils/src/`, the workspace's `src/testing/` and `__mocks__/`, the
nearest sibling) and what it found. A missing or empty Reuse item is a
blocking review finding. `@blog/utils` holds the shared small helpers, so
before writing a comparison, type check, emptiness test or small transform,
look there first.

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

## Examine before you change

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
  replaced, a test file not yet pruned (`testing-practices` → "When you
  touch a test file"). This is the steady-state rule comments already follow,
  applied to every convention.
- **Everything else is reported, not fixed** — drift in a file the diff does
  not touch, a behaviour change, a design call. It goes in the agent's
  **Examined** report section with `file:line`. The orchestrator lands it in
  the same branch when it is the same layer and small ("Findings found mid-work
  get fixed in the current work"), and otherwise puts it to the user or files
  it. A diff never grows past its ticket silently.
- **Existing code is evidence, never the standard.** What the file, its
  folder or the nearest sibling does that a rule here forbids — a hardcoded
  or recomputed value, repeated test setup, a comment, a raw type — is drift.
  It is never copied into new code or extended into an edit, and in a file
  the diff touches it is fixed under the first bullet. "It matches the
  surrounding code" and "the sibling does the same" never justify a
  violation the diff writes; the reviewer treats a copied violation as one
  the diff created. This overrides any instruction to match the surrounding
  code, as the comment rule does.
- **A ticket whose premise the code contradicts stops the work.** A moved line
  reference is corrected without comment; a described behaviour that no longer
  exists, or a fix another PR already made, is reported before anything is
  built on it.

Every implementing agent's report carries a required **Examined** section —
what it read beyond the files it changed, what it fixed in passing, and what it
found and left — and a required **Reuse** item ("Reuse before you create"), so
a skipped examination or search shows up in the report instead of passing
silently.

## Mid-task decisions land in the ticket/spec before work continues

A decision settled in chat is real only once the issue body or spec states it. **Never silently resolve an
ambiguity:** "the issue said X but I did Y" goes to the user before commit.
Full sequence: `develop-feature` § "Mid-task decisions land in the
ticket/spec before work continues".

## Use the scoped agents

Layer work is delegated to its subagent in `.claude/agents/`, in dependency
order, for the whole lifecycle — first draft, review fix and one-line tweak
alike. The orchestrator's own hands touch only governance docs (`CLAUDE.md`,
`.claude/**`, `SPEC.md`, `README.md`, `docs/**`), scratchpad → branch
assembly, `pnpm typegen` and orchestration. Dispatches run in the background,
except the Gate 0 `board-keeper` dispatch and the board write after
`gh pr create`, and completion arrives as a notification — never poll. Details:
`develop-feature` § "Use the scoped agents"; solo cloud: "Solo-session mode".

## Use the skills

- `develop-feature` at the start of any non-trivial task; § "Skills by
  task" lists the orchestration, `superpowers:*` and `vercel:*` skills.
- `studio-schema-practices` when touching `packages/studio` schemas or migrations.
- `react-component-practices` when writing or changing any React component in
  `packages/ui`, `apps/web` or `apps/platform` — the shared rules the layer
  skills below build on.
- `ui-library-practices` when touching `packages/ui`; its § "The `@blog/ui`
  component index" (`packages/ui/COMPONENTS.md`, generated) is checked before
  deciding a feature needs a new UI component.
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
- `use-context7` before implementing against any library API, config format or
  CLI flag you are not certain of — live, version-matched docs instead of a
  guess.

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
  mechanism, and it never collides with an open PR. On touched `.ts`/`.tsx`
  files the `no-failing-comment` lint rule reports the mechanical cases — a
  doc block of more than one sentence, a `Name — does X` comment, a multi-line comment inside
  a function body, any comment in a test file — in the post-edit hook,
  lint-staged and `pnpm check:touched-lint`; the rest is the reviewer's.

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
  `IWithDataTestId`, `ILocalizedParams`, `ITenantLocalizedParams` and
  `IWithChildren` (from `@blog/config/react`). Before
  writing a type, check `packages/config/src/types/` for one that already says
  it, and add a missing one there rather than locally. Exempt are the
  generated Sanity types and the workspaces below `@blog/config` in the graph,
  which cannot import it: `@blog/utils`, `@blog/insight` and `@blog/email`. The
  raw forms already in the repo are converted file by file as each file is
  touched, the same steady-state rule as comments. Where helpers and shared
  constants live: `.claude/agents/config.md`.
- **Read an action result through its outcome guards.** `@blog/config`'s
  `isOutcomeSuccess(result)`, `isOutcomeInvalid(result)`,
  `isOutcomeServerError(result)`, `isOutcomeRefused(result)` and
  `isOutcomeUnavailable(result)` take the whole result and narrow it — never
  `result.outcome === ACTION_OUTCOME.<X>`. A guard for another outcome is
  added by the change that gives that check its second use, never ahead of
  it. Files still comparing raw outcomes, and what is left to add:
  `docs/context/action-outcome-guards.md`; a touched file converts and leaves
  that list in the same change.
- **File size budgets, in non-blank lines:** a component `.tsx` 150, a hook
  120, any other `.ts` 120. Exempt: `*-variants` files, registries and
  catalogs (`icon-registry.ts`), Studio schema definitions, generated files,
  tests and stories. A file over budget sits in
  `scripts/file-size-baseline.json` at its exact count and never grows, and a
  diff that edits one extracts the part it changes — not the whole file, and
  never as a sweep — so the file ends below its entry on the merge-base;
  `--update` then lowers (or, for a moved file, moves) the entry.
  `pnpm check:file-size` is the rule, run locally only: on the edited file by
  the post-edit hook and lint-staged, and over the whole branch in
  `pnpm verify` and pre-push. Where the extracted part goes in a React
  workspace: `react-component-practices` § Size and splitting. A new exemption
  is added here and to `scripts/check-file-size.mjs` together.
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
  value; a `<DOMAIN>_LOG` const's values are its event names, "No bare
  `console.*`" below), `as const`, and live in `@blog/config` (`constants/`). e.g.
  `export const LINK_TYPE = { INTERNAL: 'INTERNAL', EXTERNAL: 'EXTERNAL' } as const;`
  The uppercase value is the stored/serialized value, so schema `options.list`
  and migrations use it too; derive unions with `TValueOf<typeof C>`. Shape
  never changes. Casing has one exception: **log vocabulary keeps lowercase
  values** under UPPERCASE keys, because the value is read by a log pipeline,
  not stored — `LOG_LEVEL`'s severities, and each logging domain's event names
  gathered in one `<DOMAIN>_LOG` const beside the code that logs them
  (`REVALIDATE_LOG = { TENANT_ARCHIVED: 'revalidate.tenant_archived' }` in
  `apps/web/src/constants/revalidate.ts`). A file that logs imports its
  domain's `<DOMAIN>_LOG`, never a bare event string or a scalar `*_EVENT`
  const; a touched file still logging that way converts in the same change.
  The second casing exception is **a library's own vocabulary**: values a
  third-party API defines and we only compare against keep that library's
  spelling under UPPERCASE keys (`SESSION_STATUS = { AUTHENTICATED:
'authenticated' }` in `apps/web/src/constants/session.ts`, whose values
  Auth.js's `useSession` defines).
  Two further exceptions move only the home, both decided by who reads the
  const — and a const a package reads never lives in an app:

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
  `pgEnum` takes the const object and builds the enum's value list from its
  key order, so reordering the const
  silently reorders a Postgres enum — confirm with `db:generate` that no
  migration appears.

- **Reuse a const; never retype its value.** Check
  `packages/config/CONSTANTS.md` — the generated index of every key/value
  const in `@blog/config`, `@blog/db` and each app's `src/constants/` —
  before writing a string or number literal, and import the const it names
  (`HTTP_STATUS.NOT_FOUND`, never `404`). **A value written a second time
  becomes a const** in the change that writes it, homed by the placement
  rules above. Tests are included: inputs and expectations use the const, and
  a repeated test value becomes a const, or a builder in `testing/` when it
  is entity-shaped — while asserting a const's own value stays banned
  ("Never assert the source back at itself"). Exempt: generated Sanity types,
  Sanity migrations, a Sanity `_type` value and a literal type (the
  generated types already check both), Tailwind class strings, import paths, directives,
  public-site copy (it belongs in the Voice catalog), `0`, `1`, `-1`, the
  single space `' '` (a separator or a JSX space, never `KEY.SPACE`), and
  vocabulary an outside standard spells — a value compared with an env read
  (`process.env.NODE_ENV === 'production'`), an env read's bracket key
  (`process.env['X']`), a `stubEnv` argument, a protocol attribute's
  value (`sameSite: 'strict'`; for `target`, only `'_blank'`), and a
  Testing Library role query's role
  (`getByRole('button')`); a
  match in the other app is reported, never shared. Lint enforces both on
  touched files only — `prefer-shared-constant` and `no-duplicate-string` in
  the post-edit hook, lint-staged and `pnpm check:touched-lint` (in
  `pnpm verify`) — so an untouched file keeps its backlog. After adding or changing a const, run
  `pnpm gen:const-index`; `pnpm gen:const-index:check` guards drift.

- `'use client'` never in `@blog/ui`; in `apps/web` and `apps/platform` it goes
  on the smallest leaf that needs the client. Exceptions (`Carousel`,
  `Dialog`, `@blog/studio`'s mount): `react-component-practices` § "Server
  first, client at the leaf".
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
  values go in the context object, never into the name. **Each domain's event
  names live in one `<DOMAIN>_LOG` key/value const**, never a literal at the
  call: `logger.error(SIGN_IN_LOG.LINK_FAILED, { error })`, with
  `SIGN_IN_LOG = { LINK_FAILED: 'auth.sign_in_link_failed' } as const` in the
  app's `src/constants/<domain>.ts`. Its keys are UPPERCASE and its values are
  the event names, the one exception to key === value. A file that logs is
  converted when the diff touches it. **Log the gap between
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
- After a schema change run `pnpm typegen` and commit the result; never
  hand-edit `packages/config/src/sanity/generated/` — fix the schema
  (`studio-schema-practices` § "Typegen").
- **Migrations.** Until launch, write no Sanity content migration, SQL backfill
  or expand/contract pair — update the starter content instead; every
  `packages/db/src/schema/*.ts` table change still gets a generated Drizzle
  migration, and a new `NOT NULL` column needs a default. Migrations against a
  shared or production store are human-gated. Full rules: `develop-feature` §
  "Migrations".
- **Voice candidates.** Whether a new or reworded public-site string is
  tenant-editable (`VOICE_FIELDS`) or fixed (`VOICE_FIXED_KEYS`) is the user's
  decision; a layer agent that adds one reports it under **Voice candidates**.
  Classification guidance: `develop-feature` § "Check for Voice candidates".
- **Verify with `pnpm verify` from root** — it stops at the first failure and
  mirrors every required or gating CI check that has a local equivalent;
  `pnpm build` is not part of the local loop. What it chains:
  `develop-feature` § "What `pnpm verify` runs".
- **Commits and PRs.** Conventional commits (commitlint runs in
  `.husky/commit-msg`; types include this repo's `tooling`), one concern per
  PR, a PR body capped at 12 lines and 1200 characters, `Closes #<n>` only on
  the completing PR, and a stack only when the user asks. Full rules:
  `open-pull-request` § "PR conventions".
- **A rule added to a skill or agent guide for one app covers the other
  too.** `apps/web` and `apps/platform` share every convention unless the guide
  names a reason one of them differs (platform has no `modules/`, no page
  builder, no SEO surface). When a rule lands in `web.md`, check
  `platform-app.md` states the same thing, and the reverse. The same goes for a
  shared skill whose examples name only one app.
- **Docs move with the code.** Architecture changes update `SPEC.md`, feature
  behaviour its `docs/features/` page, CI and agent tooling
  `docs/context/`; a finished design doc is deleted once its shape is in the
  feature page. Full rules: `develop-feature` § "Docs that
  ship with the change".

## Reporting to the user

The outcome first, then at most a handful of lines (roughly 8 for a routine
update). Never include a retelling of a subagent's report (give the
conclusion), verification statistics ("green" unless something failed),
abandoned paths or internal reasoning, self-assessment or blame, unchanged
state (board status and remaining lists only when they change), or an
unrelated ask bundled into a status update (hold it or ask it alone). The
full rules and the epic status table (the answer to a merged epic PR or
"where are we on #<n>?"): the `report-epic-status` skill.

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

Every issue: board → In Progress, branch from `main`, the work plus
`pnpm verify`, a `reviewer` `APPROVE` on the final diff (a docs-only diff gets
an inline identifier check instead), commit, then **ask to push**, and only
after it, separately, **ask to open the PR** as a draft. Committing is free;
push and PR each need fresh, explicit approval, and broad instructions ("go
ahead", "keep going") never grant them. Steps, board reconciliation and
worktree cleanup: `open-pull-request` § "Delivery gate sequence".

## Ticket priority & triage

Creating an issue always goes through `board-keeper`, never `gh issue create`.
Every open issue carries exactly one `prio:*` label; work is pulled from
`prio:now`, then the active epic's `prio:next`. The rest: `write-ticket`.

**Findings found mid-work get fixed in the current work, not ticketed** — by
the owning layer agent, in the same branch (`write-ticket` has the exception).

**Solo-session mode.** A single cloud session — a Claude Code web/remote
session (`board-keeper.md`'s preflight), with no parallel local jobs and no
worktree/scratchpad tooling — replaces exactly three things; everything else,
including quality gates, conventional commits and the push/PR approval gates,
still applies:

- **Delegation is relaxed:** implement directly, following the checklist
  below; delivery-gate step 4's `reviewer` dispatch becomes the self-review in it.
- **Board writes** (delivery-gate steps 1 and 7) are replaced by the evidence protocol below.
- **The `job:<session-name>` PR label** does not apply and has no substitute —
  it tells concurrent local jobs apart, and a cloud session has no job id and
  no `gh`. Never reach for an MCP or REST equivalent.

**The solo-session checklist** — the one list a cloud session follows, the
`@claude` runner included, in order:

1. Read the owning layer's `.claude/agents/<layer>.md` and the skills it
   names, then every file you will change and its folder ("Examine before you
   change").
2. Search for what already exists before adding anything ("Reuse before you
   create").
3. Implement, fixing the mechanical drift in every file you touch.
4. `pnpm verify` — it runs `pnpm check:diff-hygiene`; run that alone after any
   later edit.
5. Self-review the full diff against `code-review-practices`, all three
   passes, §0's reader commands and `pnpm check:clones` included.
6. Commit, push, and open a draft PR whose body carries one **Examined** and
   one **Reuse** line, as an implementing agent's report would.

**Cloud sessions never write the project board** — they leave evidence it is
inferred from: a comment on the issue at start, a branch named for the issue,
a draft PR. **Rename a generated branch before the first push** —
`claude/<words>-<id>` or `claude/issue-<n>-<id>` — with
`git branch -m "$(pnpm -s branch:name <n> "<issue title>")"`; a new branch
under any other name is refused at push. The protocol: `open-pull-request` § "Cloud sessions never write
the project board".

## Deployment

**Automatic deployments are temporarily OFF**: never report a merged PR as
deployed. A stale dev site is not a bug, and a merged Sanity or Drizzle
migration is not live on dev until someone dispatches a deploy. Deploying is human-gated (`open-pull-request` § "Deployment").

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
