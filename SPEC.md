# Blog — Product & Architecture Spec

> **The single durable reference for this project.** Any PR that changes
> architecture, contracts, env vars, or the content model must update this file
> in the same PR (the `code-review-practices` skill enforces this).
> `docs/archive/IMPLEMENTATION_BRIEF.md` is the archived bootstrap playbook —
> historical context only; when it disagrees with this document, this document
> wins.

## 1. Product summary

A headless-CMS blog: editors author long-form articles in a Sanity Studio;
readers browse a fast, statically-rendered Next.js site. Content is fully typed
end-to-end — a schema change in the CMS surfaces as a TypeScript error in the
frontend if a consumer is out of date.

**Primary surfaces** (status as of 2026-07-14):

| Surface  | Route                            | Status                                                                                                      |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Home     | `/`                              | ✅ Built — modules-as-documents (hero + `modules[]`)                                                        |
| Blog     | `/blog` + `/blog/page/N`         | ✅ Built — paginated index (#75)                                                                            |
| Post     | `/blog/[slug]`                   | 🔲 Phase 3 (#76/#90)                                                                                        |
| Category | `/category/[slug]` (+ `/page/N`) | 🔲 Phase 3 (#91 — adopts the pagination convention)                                                         |
| Author   | `/author/[slug]`                 | 🔲 Planned — #327 (service loaders already built)                                                           |
| Page     | `/[slug]`                        | 🔲 Planned — #285; `service.pages.generic.v1.getPage` exists; slug space guarded by `RESERVED_SLUGS` (#328) |
| Feeds    | sitemap/robots/RSS               | 🔲 Phase 3 (#92)                                                                                            |

**Routing conventions** (decided 2026-07-14 — full rationale in
`docs/superpowers/specs/2026-07-14-blog-list-pagination-design.md`):

- **One route-builder** — `routes` in `@blog/config` is the single source of
  URL truth (`routes.post(slug)`, `routes.blogIndex(page?)`, …). No inline
  path templates in `service` or `web`; the sitemap and JSON-LD consume it too.
- **Pagination** — path-based, `/x/page/N` (static `page/` segment; singular).
  Page 1 lives only at the base URL; `/x/page/1` → `permanentRedirect` (308).
  Every page self-canonicalizes (never canonical-to-page-1); no
  `rel=next/prev`; non-canonical or out-of-range page params → hard 404.
- **Slug-space safety** — Next resolves static › dynamic › catch-all, so
  section segments (`blog`, `category`, `author`) always beat the root generic
  `/[slug]`; `RESERVED_SLUGS` (#328) stops editors creating pages those
  segments would shadow. No catch-all routes for fixed-shape paths.

Both environments are **live** (§13): merging to `main` deploys development;
a `vX.Y.Z` tag promotes to production.

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
  ui         Atomic Design component library (atoms→organisms)       (@blog/ui)
  utils      Framework-free helpers (async, primitives)               (@blog/utils)
configs/
  eslint, prettier, tailwind, tsconfig, vitest                        (@blog/*-config)
```

| Layer           | Imports                          | Exposes                                                                                                                                                                                                 | Must never                                                        |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `@blog/config`  | —                                | Constants (UPPERCASE key/value pairs), the `routes` URL builder (single source of URL truth), generated Sanity types + extracted schema, shared TS types, `/react` subpath for polymorphic prop helpers | contain app logic; force React on non-React consumers (subpath!)  |
| `@blog/utils`   | —                                | Pure helpers (`safeAsync`, primitives)                                                                                                                                                                  | depend on any sibling                                             |
| `@blog/service` | `config`, `utils`, Sanity SDKs   | The versioned `service` facade (`service.pages.post.v1.getPost(slug)` …), view-model types (`TPostDetail`, `THomePage`, …), `urlForImage`                                                               | import React or `@blog/ui`; return raw Sanity docs; fake defaults |
| `@blog/ui`      | `config` (types + tokens)        | Atomic-design components up to organisms (pure, prop-driven, polymorphic `as`/`linkAs` slots). No template layer — page composition belongs in `web`.                                                   | import `service`/`sanity`/`fetch`; use `'use client'`             |
| `web` (app)     | `ui`, `service`, `config`, utils | Routes, metadata, feeds, i18n, page composition; owns `PortableTextRenderer` and all framework-coupled wrappers (`SanityImage`, `SmartLink`, theme toggle)                                              | write GROQ; import Sanity SDKs; put data logic in components      |
| `cms` (app)     | `config` (constants)             | Schema types (source of truth), desk structure, content migrations                                                                                                                                      | hand-write shapes typegen should produce                          |

The graph is acyclic. `apps/web` is the only place `ui` and `service` meet.

## 5. Data flow & typegen

```
Sanity Studio (apps/cms)
      │  pnpm typegen  (sanity schema extract → schema.json,
      │                 sanity typegen generate → types.ts)
      ▼
packages/config/src/sanity/generated/{schema.json,types.ts}   (committed)
      ▼
@blog/service
  ├─ service.pages.<page>   ──thin query──►  { title, hero?, modules[]: TModuleRef, seo }
  └─ service.modules.<type> ──runQuery + groqd, keyed by module id──►  typed module view-model
      ▼
apps/web
  ├─ page.tsx           fetches service.pages.<page>, checks result.ok
  ├─ ModuleRenderer      maps each TModuleRef → MODULE_MAP[type]({ id, locale })
  └─ per-module component  fetches service.modules.<type>, maps view-model ──plain typed props──►  @blog/ui organism
```

- Typegen config lives in `apps/cms/sanity.cli.ts`; the script is
  `pnpm --filter cms typegen`. **Commit the generated files.**
- Typegen output can be non-deterministic across runs — if the diff churns,
  re-run until minimal before committing.
- Generated types mark **every** field optional (validation is runtime-only).
  The service layer restores the contract at the query boundary: explicit
  `sub.field()` projections, `.notNull()` (always last in the chain) for
  schema-required fields, `T | undefined` (never `| null`) in view-models —
  spelled `TMaybeUndefined<T>` (the `@blog/config` alias) for a value that may
  be absent, distinct from property optionality (`field?:`) — and **no faked
  defaults**: absence handling belongs to `apps/web`.
- Service loaders return `Promise<TViewModel>` and throw on missing data;
  `safeAsync` in each feature's `application/service.ts` converts throws into
  `AsyncResult<T>` (`{ ok: false, error }`). **Web must check `result.ok`
  before touching `result.data`** and owns the failure decision (`notFound()`,
  fallback, or early return).
- **Page queries are thin.** `page_home`/`page_generic` project only page
  fields plus lightweight module descriptors (`TModuleRef = { key, type, id }`,
  from `to-module-ref.ts`) — no module internals, no `conditionalByType`. Each
  module type owns its own fetcher (`service.modules.<type>.v1.get<Type>(id)`)
  under `packages/service/src/features/modules/<type>/`, with its own GROQ,
  transformer, and `T | undefined` view-model (`THeroModule`,
  `TPostListModule`, `TContentModule`, `TCtaModule`). `module_postList` fetches
  its own posts (the newest `limit`); `module_hero` resolves its own
  custom-vs-fallback fields (see §6).
- **Web renders modules generically.** `apps/web/src/modules/module-map.ts`
  registers `MODULE_MAP: Record<TModuleType, (props) => ReactNode>` — typed
  exhaustively over `TModuleType`/`MODULE_TYPE` (`@blog/config`) so omitting a
  module type from the map is a compile error. `module-renderer.tsx`'s
  `ModuleRenderer` walks a page's `modules: TModuleRef[]`, resolves each entry
  through `MODULE_MAP`, and renders the result keyed by the module's stable
  `_key`; an unrecognized type renders nothing and logs a warning rather than
  failing the page. Each per-module component
  (`apps/web/src/modules/<type>/<type>-module.tsx`) is an async Server
  Component that calls its `service.modules.<type>` fetcher, checks
  `result.ok`, and maps the view-model onto the matching pure `@blog/ui`
  organism — this is the only place that module's service and ui meet. The
  home route additionally renders a dedicated `HeroModule` for `page_home`'s
  required `hero` reference (kept separate from `modules[]`).

## 6. Content model

Source of truth: `apps/cms/src/schema-types/` (documents grouped `blog/`,
`pages/`, `settings/`; shared `objects/`; `modules/` — standalone,
cross-referenceable page-builder documents, not embedded objects). Naming
convention `{group}_{name}` is being applied incrementally (#251):
`settings_navigation`, `settings_footer`, `page_home`, `page_generic`, and
every `module_*` document are done; `siteSettings` still carries a legacy
name.

**Modules are documents, not embedded objects** — pages reference them by
`_ref`, so a module is independently listable, previewable, and reusable
across pages (Studio's built-in **Incoming references** view shows which
pages use a given module before it's edited or deleted). `MODULE_TYPE`
(`packages/config/src/constants/module.ts`) is the single source of truth for
the module type registry; every layer (cms schema list, `service.modules`
namespace, web `MODULE_MAP`) derives from it, so omitting a type from one is a
compile error or an obvious gap, not a silent drift.

**Module documents** (`apps/cms/src/schema-types/modules/`)

- `module_hero` (`heroSchema`) — internal `title`, `featuredPost` (ref to
  `post`, warning-only — falls back to the newest featured post), four
  mode/custom field pairs (`heroEyebrow`, `heroTitle`, `heroSubtitle`,
  `heroImage`) built via the `defineModeFieldPair` helper and driven by the
  UPPERCASE `HERO_FIELD_MODE` const (`CUSTOM`/`NONE`/`POST_CATEGORY`/
  `POST_TITLE`/`POST_EXCERPT`/`POST_IMAGE`), `primaryActionLabel`,
  `secondaryAction` (`link`).
- `module_postList` (`postListSchema`) — internal `title` (display heading),
  `limit` (posts to fetch, 1–12).
- `module_content` (`contentSchema`) — internal `title`, `body` (portable
  text).
- `module_cta` (`ctaSchema`) — internal `title`, `heading`, `text`, `action`
  (`link`, required).

Every module document gets a required internal `title` via the reusable
`titleField` helper (§ below) so it's listable/previewable in Studio
independent of its display fields.

**Page documents reference modules**

- `page_home` (`homeSchema`, singleton) — `titleField` (internal Studio label;
  `preview.prepare` falls back to the generic "Unknown" when unset), `hero`
  (single **required**
  reference to a `module_hero`, kept
  separate from the module list — it always renders first), `modules` (array of
  references via `defineModulesField({ allow: [MODULE_TYPE.POST_LIST,
MODULE_TYPE.CTA] })`), `seo`.
- `page_generic` (`genericSchema`) — `title`, `slug` (source: title),
  `modules` (array of references via `defineModulesField({ allow:
[MODULE_TYPE.CONTENT, MODULE_TYPE.CTA] })`), `seo`.
- `page_blog` (`blogPageSchema`, singleton) — the `/blog` index page config; a
  non-module singleton: `titleField` (internal Studio label; `preview.prepare`
  falls back to the generic "Unknown" when unset), `heading` (the
  page `<h1>`), `supportingText` (optional line under it), `itemsPerPage`
  (number, 1–24, drives the pagination window size), `seo`.

`defineModulesField({ allow, description? })`
(`schema-types/helpers/define-modules-field.ts`) builds the `modules` array
field's `of` from the allowed `TModuleType[]`, one strong `reference` array
member per allowed type — the single place that field shape is defined,
replacing a hand-duplicated block per page document.

**Other documents**

- `post` — title, slug, excerpt, heroImage (`imageWithAlt`, **optional** — a
  post without one renders imageless rather than 404ing), author (ref),
  categories (refs), publishedAt, body (portable text incl. code blocks),
  featured, seo.
- `author` — name, slug, image, bio, role, socialLinks (unified `link`-based).
- `category` — title, slug, description.
- `siteSettings` (singleton) — `titleField` (read-only, fixed value), brand
  (`brand` object: name/prefix/suffix/logo), description, tagline,
  `defaultOgImage` (`imageWithAlt`, required — the last-resort social image).
- `settings_navigation` (singleton) — `titleField` (read-only, fixed value),
  items (links).
- `settings_footer` (singleton) — `titleField` (read-only, fixed value),
  social links.

**Reusable `titleField` helper** (`schema-types/helpers/title-field.ts`) —
`titleField({ initialValue?, readOnly?, description?, max? })` returns a
required `defineField({ name: 'title', type: 'string', … })`. Singletons pass
a fixed `initialValue` + `readOnly: true` (this — not `preview.prepare` or the
desk `S.document().title()`, which only labels the list item — is what fixes
the document form showing "Untitled"). Content/module documents pass `max`
for an editable headline.

**Objects** — `link` (unified internal/external, `LINK_TYPE` const),
`socialLink`, `brand`, `imageWithAlt` (required alt), `seo` (all-optional
override bag) + `openGraph`,
`blockText` / `richText`.

**Conventions**

- `defineType`/`defineField`/`defineArrayMember` everywhere; validation
  `rule.required()` on every field the frontend assumes; images get
  `hotspot: true` + required alt. Every schema definition is a **named
  export** (`{localName}Schema`) — never `export default defineType`.
- Enum-ish stored values come from `@blog/config` constants — **both key and
  value UPPERCASE** (`LINK_TYPE.INTERNAL === 'INTERNAL'`,
  `HERO_FIELD_MODE.CUSTOM === 'CUSTOM'`), `as const`; schema `options.list` and
  migrations use the same constant.
- Singletons enforced through desk structure; Studio also groups a top-level
  **Modules** section with one browsable list per module type (Heroes, Post
  Lists, Content, CTAs).
- No migration was needed for the modules-as-documents redesign — datasets
  were recreated clean before this model shipped.

## 7. Environment & configuration

| Variable                                   | Consumer                                | Notes                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`            | web + service                           | required; validated by Zod at import                                                                                                                   |
| `NEXT_PUBLIC_SANITY_DATASET`               | web + service                           | required                                                                                                                                               |
| `NEXT_PUBLIC_SITE_URL`                     | web (SEO)                               | optional until launch; canonical/OG/feeds                                                                                                              |
| `SANITY_API_READ_TOKEN`                    | service (server)                        | optional; private reads / future draft mode                                                                                                            |
| `SANITY_REVALIDATE_SECRET`                 | web (server)                            | optional until the #93 revalidation route exists                                                                                                       |
| `SANITY_STUDIO_PROJECT_ID`                 | cms Studio + CLI                        | required; **per environment** (env-driven; no ids in repo)                                                                                             |
| `SANITY_STUDIO_DATASET`                    | cms Studio + CLI                        | required                                                                                                                                               |
| `SANITY_STUDIO_HOSTNAME`                   | cms CLI (deploy)                        | deploy target `<host>.sanity.studio`; CI-only                                                                                                          |
| `SANITY_DEPLOY_TOKEN`                      | CI (deploy)                             | write/Deploy token; **project-scoped** → set per GitHub Environment                                                                                    |
| `SANITY_AUTH_TOKEN`                        | cms `migrate:deploy`/`migrate:backfill` | write token for the `migrationState` ledger client (`@sanity/client`); the standard Sanity CLI auth var — falls back to `SANITY_DEPLOY_TOKEN` if unset |
| `VERCEL_TOKEN` / `_ORG_ID` / `_PROJECT_ID` | CI (deploy)                             | Vercel CLI deploys; token is a Secret, ids are Variables                                                                                               |
| `TURBO_TOKEN` / `TURBO_TEAM`               | CI (all)                                | optional Vercel Remote Cache; no-op until configured                                                                                                   |
| `SKIP_ENV_VALIDATION`                      | CI builds only                          | bypasses Zod env validation where no vars exist                                                                                                        |

- Env access is **always** through the validated entry points
  (`apps/web/src/utils/env/env.ts` via `@t3-oss/env-nextjs`, service's env via
  `env-core`) — never raw `process.env` in app code.
- **Turborepo runs in strict env mode**: any env var a task needs must be
  declared in `turbo.json` (`env`/`passThroughEnv`) or turbo strips it.
  `pnpm --filter` bypasses turbo and can mask a missing declaration — verify
  with `pnpm build` from root.
- **Shared config presets bust their consumers' cache.** Each cached task
  declares the `configs/*` presets it reads via `inputs` using the
  `$TURBO_ROOT$` microsyntax (repo-root-relative, cross-package): `lint` ←
  `configs/eslint`, `type-check` ← `configs/tsconfig`, `test` ← `configs/vitest`,
  `build`/`storybook:build` ← `configs/tsconfig` + `configs/tailwind`. Without
  this, editing a preset (e.g. `configs/eslint/base.js`) left `lint` a
  `FULL TURBO` cache hit against stale rules. The tasks that actually needed the
  fix are `lint` and `storybook:build` — the two with **no** `dependsOn: ["^…"]`,
  so their hash is their own files only. `type-check`/`test`/`build` carry a
  `dependsOn: ["^…"]` edge and, because every workspace lists the `configs/*`
  packages as `devDependencies`, already invalidate on any preset edit through
  Turbo's dependency closure; their explicit `inputs` pin the contract precisely
  rather than fixing a live bug, and are preferred over a blunt
  `globalDependencies: ["configs/**"]` (which over-invalidates across task types).
  Globs stay single-level and extension-scoped (`*.js`/`*.json`/`*.ts`/`*.css`)
  so `node_modules`/`.turbo` logs never leak into a task hash — note
  `configs/tsconfig/*.json` also matches that package's own `package.json`, which
  is intentional and conservative (#403).
- Never read or commit `.env*` files.

## 8. Migrations & live data (core contract)

Content is live in the `production` dataset. Schema and content are decoupled:
changing a schema does **not** change existing documents.

- Any change altering an _existing_ shape (rename/remove/move a field, rename a
  `_type`, restructure a document) **requires a content migration** — decide
  this before implementing, and surface the plan to the user. Additive,
  optional-only changes need none (say so explicitly).
- Tooling lives in `apps/cms/migrations/` (`README.md`) with helper scripts:
  `migrate:new` (folders are now UTC-timestamped, `YYYYMMDDTHHmm-<slug>`, for
  deterministic run order) / `migrate:dry` / `migrate:run` / `dataset:export`.
- Workflow: **dry-run → dataset export (backup) → human-gated run**. Running
  against `production` is human-gated, like deploys. Migrations must be
  idempotent.
- **`migrate:deploy`** runs only the migrations not yet recorded in a
  per-dataset `migrationState` ledger document (`_id: 'migrationState'`, a
  system doc — not a Studio schema type, never part of typegen), in order:
  dry-run → run (`--no-dry-run --no-confirm`) → append `{id, runAt, sha}` to
  the ledger, stopping on first failure. A second run with nothing new is a
  no-op. `migrate:backfill` records the currently-pending folder migrations as
  applied **without** running them (one-time, per dataset, for migrations that
  predate the ledger). Both need a write token (`SANITY_AUTH_TOKEN` /
  `SANITY_DEPLOY_TOKEN`) and remain **manual, local-only commands today** — no
  CI workflow invokes them yet.
- CI (`Migrations` job) validates every migration loads and — with a read
  token — dry-runs each one read-only. It never mutates data.
- Future: a gated post-merge workflow that runs `migrate:deploy` against
  `production` automatically (write token, durable backup, release ordering
  vs. the Vercel web deploy) — designed in
  `docs/superpowers/specs/2026-07-10-migration-deployment-automation-design.md`
  (#261, rollout steps 4–5); steps 1–3 (timestamped ids, the ledger,
  `migrate:deploy`/`migrate:backfill`) are implemented and usable locally
  today, e.g. `SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:deploy`.

## 9. Rendering, caching & i18n

- **Default:** static generation; `generateStaticParams` for dynamic routes
  (service exposes `params` slices returning `{ slug }[]`).
- **Revalidation:** time-based via `isr('tag')` in service queries; on-demand
  via `app/api/revalidate` (#93, secret-verified,
  `revalidateTag(tag, { expire: 0 })` — immediate expiry, not a stale-while-
  revalidate profile) from a Sanity publish webhook. Tag expiry alone does not
  invalidate prerendered route entries on Vercel (#318), so the route also
  calls `revalidatePath('/', 'layout')` when a registered type matched —
  purging every page per publish (acceptable blast radius for a blog).
- **Sanity CDN is deliberately bypassed** (`useCdn: false` in the service
  client): Next's tagged data cache is the sole caching layer. Reading through
  the CDN lets a just-purged tag refetch a still-stale CDN response and
  re-cache it — do not flip it back on as a perf optimisation (#316).
- **Preview/drafts:** Next.js Draft Mode + Sanity Presentation — planned
  post-deployment (see backlog), enabled by `SANITY_API_READ_TOKEN`.
- **i18n:** all routes under `src/app/[locale]/`; next-intl middleware with
  `localePrefix: 'never'` (URLs never show the locale). Locales come from
  `LOCALE_ISO_CODES` in `@blog/config` (currently `en`). Never hardcode a
  locale; `setRequestLocale(locale)` at the top of every layout/page. Links go
  through `SmartLink` (`@web/components/smart-link`) or the locale-aware
  `Link` from `@web/i18n/navigation` — never `next/link` directly.

## 10. SEO & accessibility

- Per-route `generateMetadata` (title, description, canonical, Open Graph,
  Twitter card) using `NEXT_PUBLIC_SITE_URL`.
- **SEO fallback resolution lives in `service`**, not the routes: a single
  `resolveSeo` transformer applies the ladder **authored `seo` →
  content-derived → site defaults** once per field, returning a fully-resolved
  `TSeoResolved`. `web` maps it to `Metadata` with one shared `toMetadata`
  helper — no `??` fallback chains in route files. Page loaders
  (`getHomePage`, `getIndexPage`) fetch site settings internally (Next dedupes)
  and return `seo: TSeoResolved`. The home title is emitted **absolute** (it is
  the brand) so the layout `%s | Brand` template does not double-append; site
  settings contribute only `description` + `defaultOgImage` as the final rung.
  If no image resolves at any rung, `ogImageUrl` is absent and the route omits
  `og:image` / the twitter image rather than emitting an empty tag.
- Paginated lists: every page **self-canonical** (never canonical-to-page-1),
  no `rel=next/prev`, out-of-range → hard 404 (§1 routing conventions).
- JSON-LD `Article`/`BlogPosting` on post pages (#94).
- `sitemap.ts`, `robots.ts`, RSS route (#92).
- Security headers shipped from `next.config.ts`: strict CSP (documented
  inline), HSTS, `X-Frame-Options: DENY`, referrer + permissions policies.
- Semantic HTML; card titles are heading tags; no hardcoded `aria-label`s in
  `ui` (always an `ariaLabel` prop); date formatting happens in `web` (pass
  `formattedDate` down). Target Lighthouse ≥ 95 in all categories.
- Mobile-first responsive design on Tailwind default breakpoints (`md`/`lg` as
  the two layout tiers); fluid `clamp()` tokens preferred; page width owned by
  `apps/web` (`max-w-content`), `ui` stays width-agnostic.

## 11. Quality bar

- TypeScript `strict`, `noUncheckedIndexedAccess`; no `any`.
- Unit tests co-located (`*.test.ts(x)`): `ui` component behaviour, `service`
  transformers/loaders (mock the client), `web` route components (mock
  `service`). Faker (seeded) for fixtures. `pnpm test` must pass.
- Storybook stories are part of done for every new/changed `ui` component
  (`ui-storybook` skill) and for `web` compositions (`web-storybook` skill).
- CI (required checks on PRs to `main`): Type-check, Lint, Test, Typegen,
  Migrations (load + read-only dry-run), Build, dependency-review — plus
  advisory jobs: knip (unused files/exports/dependencies), actionlint + zizmor
  (workflow lint + security), Dependabot, and Claude code review. knip starts
  non-required and is promoted to a required check once it has held zero false
  positives across two weeks of PRs (human-gated ruleset change).
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
and release runbook live in `docs/DEPLOY.md`; this is the shape.

| Concern                 | Development                           | Production                         |
| ----------------------- | ------------------------------------- | ---------------------------------- |
| Sanity project          | separate dev project (id via env)     | separate prod project (id via env) |
| Sanity dataset          | `development`                         | `production`                       |
| Studio hostname         | `valovinnikov-blog-dev.sanity.studio` | `valovinnikov-blog.sanity.studio`  |
| Vercel project          | `blog-dev`                            | `blog-prod`                        |
| Deploy trigger          | push/merge to `main`                  | push git tag `v*`                  |
| Web deploy mechanism    | Vercel CLI in GitHub Actions          | Vercel CLI in GitHub Actions       |
| Studio deploy mechanism | GitHub Actions (`sanity deploy`)      | GitHub Actions (`sanity deploy`)   |
| Revalidation webhook    | dev webhook → dev site                | prod webhook → prod site           |

- `main` is a continuous **staging line** (auto-deploys to development, which is
  also the local-dev dataset); a **`vMAJOR.MINOR.PATCH` git tag** promotes that
  exact commit to production. The tag is the sole source of truth for the version
  (`package.json` version is not synced). Content is never versioned — it flows
  Studio → revalidation webhook independently of releases.
- **Content migrations run inside the prod deploy, gated and ordered.** The prod
  tag workflow is `verify → migrate → { deploy-studio, deploy-web }`: the
  `migrate` job applies only un-applied migrations (`migrate:deploy`, tracked in
  a per-dataset `migrationState` ledger) behind the `production` approval gate
  and after a dataset-export backup, so readers never receive new code ahead of
  the migrated data. Runbook in `docs/DEPLOY.md`.
- The Sanity CLI is env-driven on **both** dataset (`SANITY_STUDIO_DATASET`) and
  hostname (`SANITY_STUDIO_HOSTNAME`), so one `sanity.cli.ts` deploys either
  Studio (`apps/cms/sanity.cli.ts`).
- **Each environment is a separate Sanity project** (not one project with two
  datasets); each has its own project id, kept **env-driven and never committed**
  (this repo hardcodes no Sanity ids). Because Sanity tokens are
  **project-scoped**, dev and prod each need their own deploy + read tokens,
  wired as **environment-scoped** GitHub secrets/variables (the `development` and
  `production` GitHub Environments) so each deploy job resolves its own project.
- Two Vercel projects give full isolation. **Both** have Vercel's Git auto-deploy
  disabled — declaratively, via `apps/web/vercel.json`'s
  `git.deploymentEnabled: false` (#445; both projects share Root Directory
  `apps/web`, so one committed file governs both, unlike the previous
  per-project console "Ignored Build Step" setting it replaced) — and are
  deployed **only** via the Vercel CLI from GitHub Actions — so nothing
  deploys pre-merge, there are **no PR preview deploys**, and a `main` push
  can never reach production.
- **Deploys are CI-gated.** Each workflow runs a `verify` job
  (type-check/lint/test/build) that the deploy jobs `needs`, so a deploy happens
  only after checks pass on the exact commit:
  `.github/workflows/deploy-development.yml` (on merge to `main` → dev Studio +
  dev web, each deployed only when its turbo graph is affected by the merge, via
  `turbo-ignore`; `workflow_dispatch` forces both) and
  `.github/workflows/deploy-production.yml` (on a `v*` tag → prod Studio + prod
  web, always both — a tag is a deliberate full release). Deploy steps are
  guarded on their secret being present, so the workflows no-op green until the
  one-time console setup (`docs/DEPLOY.md`).
- Historical phased rollout tickets (D0–D5) live in `docs/BACKLOG.md`.

## 14. Tooling: agents & skills

The repo ships Claude Code configuration so contributors (human or AI) stay
inside the layer contracts:

- **Subagents** (`.claude/agents/`): `config`, `cms`, `service`, `ui`, `web` —
  each scoped to one workspace, delegated in dependency order
  (`config → cms → service → ui → web`). The orchestrator never writes layer
  files before delegating. Plus read-only subagents dispatched alongside the
  layer work, all gating the commit ask the same way `reviewer` does when
  dispatched: `reviewer` (pre-commit review of the full diff — must return
  `APPROVE` before the orchestrator may ask to commit), `a11y-reviewer`
  (accessibility audit of `packages/ui`/`apps/web` diffs against
  `ui-library-practices`' non-negotiable rules), `seo-auditor` (SEO/metadata
  audit whenever a diff touches `apps/web` routes, metadata, structured data,
  or feeds, applying the `seo-and-metadata` skill as its checklist), and
  `explore`, a Haiku discovery scout that answers broad "where / how /
  whether" questions in a disposable context and returns conclusions with
  `file:line` pointers, keeping that reading out of the orchestrator's
  window. `test-writer` adds/extends co-located `*.test.ts(x)` coverage after
  the layer agents finish, scoped to test files by enforcement. `board-keeper`
  reconciles the project board against repo reality after every PR open/merge.
- **Skills** (`.claude/skills/`): `develop-feature` (lifecycle + delegation —
  the entry point for any non-trivial task), `add-content-type` (cross-layer
  recipe), `cms-schema-practices` (schema + migration quality bar),
  `ui-library-practices`, `ui-storybook`, `web-storybook`,
  `testing-practices`, `seo-and-metadata`, `code-review-practices`,
  `open-pull-request`, `use-context7` (live version-matched docs).
- **Settings** (`.claude/settings.json`): permission allowlist for the
  project's standard commands (deploys and `.env` reads denied), hook wiring,
  and plugin provisioning (`extraKnownMarketplaces` + `enabledPlugins`) so a
  fresh clone resolves the plugins the repo's guidance depends on.

## 15. Out of scope (for now)

Comments, search, newsletter signup, multi-author dashboards, analytics beyond
Vercel's built-in, and the AI/differentiator feature track (agent-native
endpoints, publish-time generation — proposed in `docs/BACKLOG.md`). Each can
be layered on without violating the contracts above.

## 16. Maintaining this document

- Architecture/contract/content-model/env changes ⇒ update this file in the
  same PR.
- The content model section (§6) describes the _current_ schema — update it
  when #250/#251 land.
- `docs/archive/IMPLEMENTATION_BRIEF.md` is frozen history; do not extend it.
