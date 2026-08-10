# Blog — Product & Architecture Spec

> **The single durable reference for this project.** Any PR that changes
> architecture, contracts, env vars, or the content model must update this file
> (or the relevant `docs/context/*.md` file it links to) in the same PR (the
> `code-review-practices` skill enforces this).
> `docs/archive/IMPLEMENTATION_BRIEF.md` is the archived bootstrap playbook —
> historical context only; when it disagrees with this document, this document
> wins.
>
> This file holds the durable architecture contract — what every layer owns,
> what it may import, and the current product state. Long-form detail one
> level down (full content model, full data flow, full env var reference,
> rendering/i18n mechanics, SEO checklist, routing history, tooling roster)
> lives in `docs/context/*.md`, linked from each section below — see
> [`docs/README.md`](./docs/README.md) for the full docs map. **Section
> numbers below are stable** — other files reference them by number
> (`SPEC.md §N`); if a section is trimmed or its detail moves out, its number
> stays put.

## 1. Product summary

A headless-CMS blog: editors author long-form articles in a Sanity Studio;
readers browse a fast, statically-rendered Next.js site. Content is fully typed
end-to-end — a schema change in the CMS surfaces as a TypeScript error in the
frontend if a consumer is out of date.

**Primary surfaces** (status as of 2026-07-23):

| Surface  | Route                            | Status                                                                                                         |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Home     | `/`                              | ✅ Built — modules-as-documents (hero + `modules[]`)                                                           |
| Blog     | `/blog` + `/blog/page/N`         | ✅ Built — paginated index (#75)                                                                               |
| Post     | `/blog/[slug]`                   | ✅ Built — post detail page + JSON-LD (#76)                                                                    |
| Category | `/category/[slug]` (+ `/page/N`) | ✅ Built — unpaginated + paginated routes (#91/#588/#589)                                                      |
| Tag      | `/tag/[slug]` (+ `/page/N`)      | ✅ Built — unpaginated + paginated tag archives, shared-tag related posts, per-tag RSS (#674)                  |
| Author   | `/author/[slug]` (+ `/page/N`)   | ✅ Built — profile + posts by author, paginated (#327/#593-595/#744)                                           |
| Topics   | `/topics`                        | ✅ Built — hub listing every category with post counts, links to archives (#750/#751/#752)                     |
| Page     | `/[slug]`                        | ✅ Built — generic page route (#285), slug space guarded by `RESERVED_SLUGS` (#328)                            |
| Feeds    | sitemap/robots/RSS               | ✅ Built — Phase 3 (#92), generic pages listed in the sitemap (#285); tag archives + per-tag RSS added in #674 |

Phase 3 (Blog core) is fully closed as of 2026-07-21 — every primary surface
built in that phase is merged. Post taxonomy (category `max: 4` cap + the
`/tag/*` axis above) shipped as milestone M3 (#674) on 2026-07-23; the
category cap was narrowed to a single required reference in #809 on
2026-07-24 (see §6 Content model).

Both environments are **live** (§13): merging to `main` deploys development;
a `vX.Y.Z` tag promotes to production.

**Routing conventions, per-surface layout decisions, and their history**
(pagination/canonical rules, the tag axis, post-detail layout, choose-your-depth
reading, page canvas elevation) are documented in full in
[`docs/context/surfaces-and-routing.md`](./docs/context/surfaces-and-routing.md).

## 2. Architecture principles

1. **Strict layering.** Presentation (`ui`), data (`service`), and composition
   (`web`) never blur. The dependency graph is acyclic.
2. **One source of truth for types.** Sanity schemas generate types into
   `@blog/config` (`packages/config/src/sanity/generated/types.ts`); every
   other package consumes them. No hand-redeclared content shapes.
3. **Portable design system.** `ui` is pure, prop-driven, and free of any
   Sanity/Next coupling, so it could be extracted to its own npm package
   without edits.
4. **Server-first.** React Server Components by default; client components only
   for genuine interactivity, added at the leaf boundary in `apps/web` (never
   in `@blog/ui`).
5. **Static + ISR.** Pages are statically generated and revalidated on a timer
   and (once #93 ships) on-demand via webhook — no server round-trip on the hot
   path.
6. **Live data is sacred.** The `production` dataset holds real content. Any
   schema change that alters an existing shape requires a content migration
   (§8) — never orphan documents.

## 3. Stack

- **Next.js 16** (App Router, RSC, TypeScript strict) + **React 19** — `apps/web`
- **Sanity Studio v6** (`sanity ^6`, `@sanity/cli ^7`) — `apps/cms`
- **Tailwind CSS v4** (shared token preset) + `tailwind-variants`
- **next-intl** for i18n (currently `en` only, `localePrefix: 'never'`)
- **groqd** query builder in the service layer
- **Neon Postgres + Drizzle ORM** (`packages/db`) — the non-Sanity relational
  store for the engagement layer (Auth.js, comments, ratings, bookmarks,
  subscribers); scaffolded in #984, see §4 and §15
- **Auth.js v5** (`next-auth@beta` + `@auth/drizzle-adapter`) in `apps/web` —
  GitHub, Google, and email-magic-link sign-in against `@blog/db`'s adapter
  tables (database session strategy); the magic-link email and a shared
  Resend "send email" helper live in `apps/web/src/server/` (#1107)
- **Vitest + Testing Library**; **Storybook** in `packages/ui` and `apps/web`
- **Turborepo + pnpm** workspaces; Node ≥ 20.19 (CI runs 22), pnpm 9.15

## 4. Workspace map & layer contracts

```
apps/
  cms        Sanity Studio: schemas, desk structure, migrations       (cms)
  web        Next.js frontend: routes, SEO, i18n, composition         (web)
packages/
  config     Shared constants, generated Sanity types, tokens,        (@blog/config)
             polymorphic React helpers (via /react subpath)
  service    Data access: Sanity client, groqd queries, transformers  (@blog/service)
  db         Relational data access: Neon + Drizzle (engagement layer) (@blog/db)
  ui         Atomic Design component library (atoms→organisms)       (@blog/ui)
  utils      Framework-free helpers (async, primitives)               (@blog/utils)
configs/
  eslint, prettier, tailwind, tsconfig, vitest                        (@blog/*-config)
```

| Layer           | Imports                                | Exposes                                                                                                                                                                                                 | Must never                                                                                        |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@blog/config`  | —                                      | Constants (UPPERCASE key/value pairs), the `routes` URL builder (single source of URL truth), generated Sanity types + extracted schema, shared TS types, `/react` subpath for polymorphic prop helpers | contain app logic; force React on non-React consumers (subpath!)                                  |
| `@blog/utils`   | —                                      | Pure helpers (`safeAsync`, primitives)                                                                                                                                                                  | depend on any sibling                                                                             |
| `@blog/service` | `config`, `utils`, Sanity SDKs         | The versioned `service` facade (`service.pages.post.v1.getPost(slug)` …), view-model types (`TPostDetail`, `THomePage`, …), `urlForImage`                                                               | import React or `@blog/ui`; return raw Sanity docs; fake defaults                                 |
| `@blog/db`      | `config`, `utils`, Drizzle/Neon SDKs   | Typed query/mutation functions over Neon Postgres (Auth.js adapter tables, comments, ratings, bookmarks, subscribers) — the relational sibling to `service`, not a dependent of it                      | import React, `@blog/ui`, `@blog/service`, or any Sanity SDK; be imported by `cms`/`service`/`ui` |
| `@blog/ui`      | `config` (types + tokens)              | Atomic-design components up to organisms (pure, prop-driven, polymorphic `as`/`linkAs` slots). No template layer — page composition belongs in `web`.                                                   | import `service`/`sanity`/`fetch`; use `'use client'`                                             |
| `web` (app)     | `ui`, `service`, `db`, `config`, utils | Routes, metadata, feeds, i18n, page composition; owns `PortableTextRenderer` and all framework-coupled wrappers (`SanityImage`, `SmartLink`, theme toggle)                                              | write GROQ; import Sanity SDKs; put data logic in components                                      |
| `cms` (app)     | `config` (constants), `utils`          | Schema types (source of truth), desk structure, content migrations                                                                                                                                      | hand-write shapes typegen should produce                                                          |

The graph is acyclic. `apps/web` is the only place `ui`, `service`, and `db`
meet — `db` and `service` are parallel data layers (Neon vs. Sanity) that
never reference each other; a feature needing both joins them in `web`.
Full contract and migration mechanism: `.claude/agents/db.md`.
Dependency-graph enforcement details and SVG/type-flow wiring:
[`docs/context/frontend-conventions.md`](./docs/context/frontend-conventions.md).

## 5. Data flow & typegen

Sanity schema → `pnpm typegen` → `@blog/config` generated types →
`@blog/service` (thin page queries + per-module fetchers, plus a scoped
`service.editorial.*` write path for the skim pipeline) → `apps/web`
(`ModuleRenderer` maps each module reference through `MODULE_MAP` to a
Server Component, which fetches its own module data and maps it onto a pure
`@blog/ui` organism). Typegen output is committed and can be non-deterministic
— re-run until minimal.

Full diagram, the service/view-model contract (`AsyncResult`, `TMaybeUndefined`,
no faked defaults), the module-registry mechanism, and the editorial write path:
[`docs/context/data-flow.md`](./docs/context/data-flow.md).

## 6. Content model

Source of truth: `apps/cms/src/schema-types/` — documents (`post`, `author`,
`category`, `tag`, page documents, singletons), standalone `module_*`
page-builder documents, and shared objects (`link`, `imageWithAlt`, `bodyImage`,
`seo`, `aside`, `skim`, …). Naming convention `{group}_{name}` is being applied
incrementally (#251).

Every `module_*` document also carries an optional, all-fields-optional
`appearance` object (`background`, `spacingTop`/`spacingBottom`,
`containerWidth`, `align`, `divider` — stored values from `@blog/config`'s
`BACKGROUND_TONE`/`SPACING_SCALE`/`CONTAINER_WIDTH`/`ALIGN` consts).
`service.modules.<type>.v1` projects it into each view-model as
`appearance: TAppearance | undefined`, with no faked defaults — unset stays
unset end to end. In `apps/web`, every `MODULE_MAP`-registered module
component renders its `@blog/ui` organism inside the pure `Section` atom
(`packages/ui/src/atoms/section`), passing the fetched `appearance` straight
through; `Section` maps it to token classes and supplies a rendering default
per field when unset (`background=DEFAULT`, `spacingTop`/`spacingBottom=MD`,
`containerWidth=WIDE`, `align=START`, `divider=false`). `module_hero` is the
one exception: despite carrying `appearance` too, it never wraps in `Section`
— it is already a self-contained full-bleed band (own background, own width,
flush against the sticky header), and `Section`'s constrained/padded defaults
would break that layout even with `appearance` unset (#1316, closed as
not-planned). It only consumes `appearance.background`, re-applying `Section`'s
own token mapping directly via `className`.

Full schema reference (every document/object, field-by-field), naming and
validation conventions, incl. the `appearance` object's own field list:
[`docs/context/content-model.md`](./docs/context/content-model.md).

## 7. Environment & configuration

Every env var this repo uses, its consumer, and whether it's required is the
canonical table in
[`docs/context/environment-variables.md`](./docs/context/environment-variables.md)
— includes the access conventions (validated entry points only, turbo strict
env mode, cache-busting on shared config presets).

## 8. Migrations & live data (core contract)

Content is live in the `production` dataset. Schema and content are decoupled:
changing a schema does **not** change existing documents. Any change altering
an _existing_ shape (rename/remove/move a field, rename a `_type`, restructure
a document) **requires a content migration** — decide this before
implementing, and surface the plan to the user. Additive, optional-only
changes need none (say so explicitly). Workflow: **dry-run → dataset export
(backup) → human-gated run**, same as deploys.

Full migration tooling (`apps/cms/migrations/`, the `migrationState` ledger,
`migrate:deploy`/`migrate:backfill`) is documented alongside the content model
in [`docs/context/content-model.md`](./docs/context/content-model.md).

**`@blog/db` (Neon/Drizzle) has a separate, parallel migration mechanism** —
schema migrations, not content migrations: a `packages/db/src/schema/*.ts`
change is diffed by `drizzle-kit generate` into a reviewable, committed SQL
file (that generation step is the dry-run — it never touches the database),
applied to `development` freely, and applied to the shared/production Neon
branch only after a backup (Neon branch snapshot or `pg_dump`) and only as a
human-gated step, the same production gate as `sanity deploy` and Sanity
content migrations. Full workflow: `.claude/agents/db.md`'s "Migrations"
section (rollback strategy is an open decision, not yet settled).

## 9. Rendering, caching & i18n

Static generation by default with time-based + on-demand ISR revalidation; the
skim-generation pipeline (`/api/generate-skim`); the Sanity CDN is
deliberately bypassed; i18n runs through `next-intl` with a locale-prefix-free
URL scheme and a single `SmartLink` for all in-app navigation.

Full mechanics:
[`docs/context/rendering-caching-i18n.md`](./docs/context/rendering-caching-i18n.md).

## 10. SEO & accessibility

Per-route `generateMetadata` with a `service`-owned SEO fallback ladder
(authored → content-derived → site defaults), JSON-LD (`Article`/`BlogPosting`,
`BreadcrumbList`), self-canonical pagination, per-environment `noindex`
outside `production`, and the accessibility non-negotiables (no hardcoded
`aria-label`s in `ui`, semantic heading tags, Lighthouse ≥ 95 target).

Full checklist:
[`docs/context/seo-accessibility.md`](./docs/context/seo-accessibility.md).

## 11. Quality bar

- TypeScript `strict`, `noUncheckedIndexedAccess`; no `any`.
- Unit tests co-located (`*.test.ts(x)`): `ui` component behaviour, `service`
  transformers/loaders (mock the client), `web` route components (mock
  `service`). Faker (seeded) for fixtures. `pnpm test` must pass.
- Storybook stories are part of done for every new/changed `ui` component
  (`ui-storybook` skill) and for `web` compositions (`web-storybook` skill).
- CI (required checks on PRs to `main`): Type-check, Lint, Test, Typegen,
  Migrations (load + read-only dry-run), Build, dependency-review — plus five
  required checks (Zizmor, Actionlint, Knip, Commitlint, Hooks) and several
  advisory jobs (Test Presence, Claude Code Review, Lighthouse CI, Playwright
  smoke). Full workflow-by-workflow breakdown:
  [`docs/context/ci-automation.md`](./docs/context/ci-automation.md).
- Hooks: husky + lint-staged (eslint --fix + prettier on staged files).
- Conventional commits; one concern per PR.

## 12. Delivery process

Work is tracked on the GitHub project board ("Blog Build"). Every issue follows
the gate sequence (also in `CLAUDE.md` — the operational source of truth):

1. Board → In Progress → branch from `main` → work + quality gates.
2. **Commit, push, and PR are three separate human-approved gates.**
3. After PR: issue → Code Review on the board; after merge: reconcile board.
4. `sanity deploy`, Vercel deploys, and `production` migrations are
   **human-gated** — agents never run them.

## 13. Deployment topology

Two long-lived environments, deployed by trigger. The full click-by-click setup
and release runbook live in [`docs/DEPLOY.md`](./docs/DEPLOY.md); this is the shape.

| Concern                 | Development                       | Production                         |
| ----------------------- | --------------------------------- | ---------------------------------- |
| Sanity project          | separate dev project (id via env) | separate prod project (id via env) |
| Sanity dataset          | `development`                     | `production`                       |
| Studio hostname         | `studio-dev{your_hosting}`        | `studio.{your-hosting}`            |
| Vercel project (web)    | `blog-dev`                        | `blog-prod`                        |
| Vercel project (studio) | `cms-dev`                         | `cms-prod`                         |
| Deploy trigger          | push/merge to `main`              | push git tag `v*`                  |
| Web deploy mechanism    | Vercel CLI in GitHub Actions      | Vercel CLI in GitHub Actions       |
| Studio deploy mechanism | Vercel CLI in GitHub Actions      | Vercel CLI in GitHub Actions       |
| Revalidation webhook    | dev webhook → dev site            | prod webhook → prod site           |

- `main` is a continuous **staging line** (auto-deploys to development, which is
  also the local-dev dataset); a **`vMAJOR.MINOR.PATCH` git tag** promotes that
  exact commit to production. Content migrations run inside the gated prod
  deploy (`verify → migrate → deploy`), never ahead of the migrated data.
  `@blog/db`'s Drizzle/Neon schema migrations run the same way, alongside the
  Sanity ones, via their own `migrate-db` job in both deploy workflows (dev:
  automatic; prod: backed up via `pg_dump`, gated behind the same required-
  reviewer approval) — see `docs/DEPLOY.md` and `.claude/agents/db.md`'s
  "Migrations" section.
- **Each environment is a separate Sanity project** with its own env-driven,
  never-committed project id and tokens; **four fully isolated Vercel
  projects** (a web project and a Studio project per environment), all with
  Git auto-deploy disabled — deploys only run via the Vercel CLI from GitHub
  Actions, so there are no PR preview deploys and a `main` push can never
  reach production. The Studio is a static `sanity build` export served from
  its Vercel project — no `*.sanity.studio` hosting or `sanity deploy` anymore.
- `@blog/ui`'s Storybook is hosted separately (`blog-storybook` Vercel
  project, `ui-library.{your-hosting}`) via Vercel's Git integration with PR
  previews — a deliberate exception to the CI-gated, no-preview pattern
  above, since it carries no Sanity data or credentials. See
  [`docs/DEPLOY.md`](./docs/DEPLOY.md)'s Storybook section.
- Deploys are CI-gated behind a `verify` job (type-check/lint/test/build) on
  the exact commit being deployed; deploy steps no-op green until the
  one-time console setup ([`docs/DEPLOY.md`](./docs/DEPLOY.md)) provides their secret.
- Historical phased rollout tickets (D0–D5) live in `docs/BACKLOG.md`.
- Full topology detail (per-environment isolation rationale, dataset refresh
  workflow, tag-as-source-of-truth) is in [`docs/DEPLOY.md`](./docs/DEPLOY.md) —
  this section stays a summary to avoid drifting from that runbook.

## 14. Tooling: agents & skills

The repo ships Claude Code configuration (subagents, hooks, skills, settings,
MCP servers, a scheduled review routine) so contributors — human or AI — stay
inside the layer contracts above. Full roster and rationale for every piece:
[`docs/context/claude-code.md`](./docs/context/claude-code.md).

## 15. Out of scope (for now)

Multi-author dashboards, analytics beyond Vercel's built-in, semantic search,
and the AI/differentiator feature track (agent-native endpoints, publish-time
generation — proposed in `docs/BACKLOG.md`). Each can be layered on without
violating the contracts above. **No longer out of scope:** comments, ratings,
bookmarks, newsletter signup, and user auth — these are the actively-roadmapped
M5 engagement layer (`docs/BACKLOG.md`'s "M5 — Engagement layer" section,
epics #1039–#1044), built on the new `@blog/db` layer (§3, §4, §8).

## 16. Maintaining this document

- Architecture/contract/content-model/env changes ⇒ update this file **or**
  the relevant `docs/context/*.md` file it links to, in the same PR — whichever
  actually holds the detail that changed. Don't let a `docs/context/*.md` file
  drift out of sync with a summary here.
- **Section numbers are stable** — other files (`.claude/agents/*.md`,
  `docs/BACKLOG.md`, active plan docs, even code comments like
  `apps/web/playwright.config.ts`) cite sections by number. Never renumber an
  existing section when trimming or splitting it out; add or remove content
  within the section instead.
- The content model section (§6) and its full reference
  (`docs/context/content-model.md`) describe the _current_ schema — update it
  when #250/#251 land.
- `docs/archive/IMPLEMENTATION_BRIEF.md` is frozen history; do not extend it.
