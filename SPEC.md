# Blog — Product & Architecture Spec

> **The single durable reference for this project.** Any PR that changes
> architecture, contracts, env vars, or the content model must update this file
> in the same PR (the `code-review-practices` skill enforces this).
> `IMPLEMENTATION_BRIEF.md` is the archived bootstrap playbook — historical
> context only; when it disagrees with this document, this document wins.

## 1. Product summary

A headless-CMS blog: editors author long-form articles in a Sanity Studio;
readers browse a fast, statically-rendered Next.js site. Content is fully typed
end-to-end — a schema change in the CMS surfaces as a TypeScript error in the
frontend if a consumer is out of date.

**Primary surfaces** (status as of 2026-07-11):

| Surface  | Route              | Status                          |
| -------- | ------------------ | ------------------------------- |
| Home     | `/`                | ✅ Built (hero + latest posts)  |
| Post     | `/blog/[slug]`     | 🔲 Phase 3 (#76/#90)            |
| Blog     | `/blog`            | 🔲 Phase 3 (#75)                |
| Category | `/category/[slug]` | 🔲 Phase 3 (#77/#91)            |
| Page     | `/[slug]`          | 🔲 Planned (modules[] via #250) |
| Feeds    | sitemap/robots/RSS | 🔲 Phase 3 (#92)                |

The site is **not yet deployed** — see `docs/BACKLOG.md` (deploy milestone) for
the phased rollout plan.

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

| Layer           | Imports                          | Exposes                                                                                                                                                    | Must never                                                        |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `@blog/config`  | —                                | Constants (UPPERCASE key/value pairs), generated Sanity types + extracted schema, shared TS types, `/react` subpath for polymorphic prop helpers           | contain app logic; force React on non-React consumers (subpath!)  |
| `@blog/utils`   | —                                | Pure helpers (`safeAsync`, primitives)                                                                                                                     | depend on any sibling                                             |
| `@blog/service` | `config`, `utils`, Sanity SDKs   | The versioned `service` facade (`service.pages.post.v1.getPost(slug)` …), view-model types (`TPostDetail`, `THomePage`, …), `urlForImage`                  | import React or `@blog/ui`; return raw Sanity docs; fake defaults |
| `@blog/ui`      | `config` (types + tokens)        | Atomic-design components up to organisms (pure, prop-driven, polymorphic `as`/`linkAs` slots). No template layer — page composition belongs in `web`.      | import `service`/`sanity`/`fetch`; use `'use client'`             |
| `web` (app)     | `ui`, `service`, `config`, utils | Routes, metadata, feeds, i18n, page composition; owns `PortableTextRenderer` and all framework-coupled wrappers (`SanityImage`, `SmartLink`, theme toggle) | write GROQ; import Sanity SDKs; put data logic in components      |
| `cms` (app)     | `config` (constants)             | Schema types (source of truth), desk structure, content migrations                                                                                         | hand-write shapes typegen should produce                          |

The graph is acyclic. `apps/web` is the only place `ui` and `service` meet.

## 5. Data flow & typegen

```
Sanity Studio (apps/cms)
      │  pnpm typegen  (sanity schema extract → schema.json,
      │                 sanity typegen generate → types.ts)
      ▼
packages/config/src/sanity/generated/{schema.json,types.ts}   (committed)
      ▼
@blog/service  ──runQuery + groqd──►  typed view-models (TPostDetail, …)
      ▼
apps/web Server Component  ──plain typed props──►  @blog/ui
```

- Typegen config lives in `apps/cms/sanity.cli.ts`; the script is
  `pnpm --filter cms typegen`. **Commit the generated files.**
- Typegen output can be non-deterministic across runs — if the diff churns,
  re-run until minimal before committing.
- Generated types mark **every** field optional (validation is runtime-only).
  The service layer restores the contract at the query boundary: explicit
  `sub.field()` projections, `.notNull()` (always last in the chain) for
  schema-required fields, `T | undefined` (never `| null`) in view-models, and
  **no faked defaults** — absence handling belongs to `apps/web`.
- Service loaders return `Promise<TViewModel>` and throw on missing data;
  `safeAsync` in each feature's `application/service.ts` converts throws into
  `AsyncResult<T>` (`{ ok: false, error }`). **Web must check `result.ok`
  before touching `result.data`** and owns the failure decision (`notFound()`,
  fallback, or early return).

## 6. Content model

Source of truth: `apps/cms/src/schema-types/` (documents grouped `blog/`,
`pages/`, `settings/`; shared `objects/`; `modules/` reserved for the
page-builder). Naming convention `{group}_{name}` is being applied
incrementally (#251): `settings_navigation` and `settings_footer` are done;
`siteSettings` and `homePage` still carry legacy names.

**Documents**

- `post` — title, slug, excerpt, mainImage (`imageWithAlt`), author (ref),
  categories (refs), publishedAt, body (portable text incl. code blocks),
  featured, seo.
- `author` — name, slug, image, bio, role, socialLinks (unified `link`-based).
- `category` — title, slug, description.
- `page` — title, slug, body, seo. Will move to a `modules[]` page-builder
  (#250); `modules/index.ts` is currently an empty placeholder.
- `homePage` (singleton) — hero (eyebrow/title/subtitle/image each with
  auto/manual mode + featuredPost ref), latestPosts settings, seo.
- `siteSettings` (singleton) — brand (`brand` object: name/prefix/suffix/logo),
  description, tagline, defaultSeo.
- `settings_navigation` (singleton) — items (links).
- `settings_footer` (singleton) — social links.

**Objects** — `link` (unified internal/external, `LINK_TYPE` const),
`socialLink`, `brand`, `imageWithAlt` (required alt), `seo` + `openGraph`,
`blockText` / `portableText`.

**Conventions**

- `defineType`/`defineField`/`defineArrayMember` everywhere; validation
  `rule.required()` on every field the frontend assumes; images get
  `hotspot: true` + required alt.
- Enum-ish stored values come from `@blog/config` constants — **both key and
  value UPPERCASE** (`LINK_TYPE.INTERNAL === 'INTERNAL'`), `as const`; schema
  `options.list` and migrations use the same constant.
- Singletons enforced through desk structure.

## 7. Environment & configuration

| Variable                        | Consumer         | Notes                                            |
| ------------------------------- | ---------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | web + service    | required; validated by Zod at import             |
| `NEXT_PUBLIC_SANITY_DATASET`    | web + service    | required                                         |
| `NEXT_PUBLIC_SITE_URL`          | web (SEO)        | optional until launch; canonical/OG/feeds        |
| `SANITY_API_READ_TOKEN`         | service (server) | optional; private reads / future draft mode      |
| `SANITY_REVALIDATE_SECRET`      | web (server)     | optional until the #93 revalidation route exists |
| `SANITY_STUDIO_PROJECT_ID`      | cms Studio + CLI | required; no hardcoded ids in the repo           |
| `SANITY_STUDIO_DATASET`         | cms Studio + CLI | required                                         |
| `SKIP_ENV_VALIDATION`           | CI builds only   | bypasses Zod env validation where no vars exist  |

- Env access is **always** through the validated entry points
  (`apps/web/src/utils/env/env.ts` via `@t3-oss/env-nextjs`, service's env via
  `env-core`) — never raw `process.env` in app code.
- **Turborepo runs in strict env mode**: any env var a task needs must be
  declared in `turbo.json` (`env`/`passThroughEnv`) or turbo strips it.
  `pnpm --filter` bypasses turbo and can mask a missing declaration — verify
  with `pnpm build` from root.
- Never read or commit `.env*` files.

## 8. Migrations & live data (core contract)

Content is live in the `production` dataset. Schema and content are decoupled:
changing a schema does **not** change existing documents.

- Any change altering an _existing_ shape (rename/remove/move a field, rename a
  `_type`, restructure a document) **requires a content migration** — decide
  this before implementing, and surface the plan to the user. Additive,
  optional-only changes need none (say so explicitly).
- Tooling lives in `apps/cms/migrations/` (`README.md`) with helper scripts:
  `migrate:new` / `migrate:dry` / `migrate:run` / `dataset:export`.
- Workflow: **dry-run → dataset export (backup) → human-gated run**. Running
  against `production` is human-gated, like deploys. Migrations must be
  idempotent.
- CI (`Migrations` job) validates every migration loads and — with a read
  token — dry-runs each one read-only. It never mutates data.
- Future: automated post-merge migration deploys with an applied-migrations
  ledger — designed in
  `docs/superpowers/specs/2026-07-10-migration-deployment-automation-design.md`
  (#261), deferred until after first deployment.

## 9. Rendering, caching & i18n

- **Default:** static generation; `generateStaticParams` for dynamic routes
  (service exposes `params` slices returning `{ slug }[]`).
- **Revalidation:** time-based via `isr('tag')` in service queries; on-demand
  via `app/api/revalidate` (#93, secret-verified, `revalidateTag`) from a
  Sanity publish webhook.
- **Preview/drafts:** Next.js Draft Mode + Sanity Presentation — planned
  post-deployment (see backlog), enabled by `SANITY_API_READ_TOKEN`.
- **i18n:** all routes under `src/app/[locale]/`; next-intl middleware with
  `localePrefix: 'never'` (URLs never show the locale). Locales come from
  `LOCALE_ISO_CODES` in `@blog/config` (currently `en`). Never hardcode a
  locale; `setRequestLocale(locale)` at the top of every layout/page. Links go
  through `@/i18n/navigation` (`SmartLink`) — never `next/link` directly.

## 10. SEO & accessibility

- Per-route `generateMetadata` (title, description, canonical, Open Graph,
  Twitter card) using `NEXT_PUBLIC_SITE_URL`.
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
  Migrations (load + read-only dry-run), Build — plus zizmor (workflow
  security), dependency-review, Dependabot, and Claude code review.
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

## 13. Deployment topology (planned)

Not yet deployed. Target: Sanity-hosted Studio (`sanity deploy`) + web app on
Vercel (root dir `apps/web`, turbo-ignore build filter, env vars from §7,
`npx turbo-ignore web` as the Ignored Build Step). Phased plan with tickets
lives in `docs/BACKLOG.md` (D0–D5): accounts/tokens → Studio + CORS → Vercel
web → content + revalidation webhook → launch hardening (feeds, JSON-LD,
smoke tests) → operational automation (migration ledger, remote caching).

## 14. Tooling: agents & skills

The repo ships Claude Code configuration so contributors (human or AI) stay
inside the layer contracts:

- **Subagents** (`.claude/agents/`): `cms`, `service`, `ui`, `web` — each
  scoped to one workspace, delegated in dependency order
  (`cms → service → ui → web`). The orchestrator never writes layer files
  before delegating.
- **Skills** (`.claude/skills/`): `develop-feature` (lifecycle + delegation —
  the entry point for any non-trivial task), `add-content-type` (cross-layer
  recipe), `ui-library-practices`, `ui-storybook`, `web-storybook`,
  `testing-practices`, `seo-and-metadata`, `code-review-practices`,
  `open-pull-request`, `use-context7` (live version-matched docs).
- `.agents/skills/` mirrors `.claude/skills/` for other harnesses — keep them
  in sync (canonical copy: `.claude/skills/`).
- **Settings** (`.claude/settings.json`): permission allowlist for the
  project's standard commands.

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
- `IMPLEMENTATION_BRIEF.md` is frozen history; do not extend it.
