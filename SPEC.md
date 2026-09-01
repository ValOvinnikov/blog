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

| Surface | Route                          | Status                                                                                                                                                                           |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home    | `/`                            | ✅ Built — modules-as-documents (hero + `modules[]`)                                                                                                                             |
| Blog    | `/blog` + `/blog/page/N`       | ✅ Built — paginated index (#75)                                                                                                                                                 |
| Post    | `/blog/[slug]`                 | ✅ Built — post detail page + JSON-LD (#76)                                                                                                                                      |
| Topic   | `/topics/[slug]` (+ `/page/N`) | ✅ Built — unpaginated + paginated routes (#91/#588/#589); renamed from `category` in #1812; CMS-authored via the `page_topic` document since #1915                              |
| Tag     | `/tags/[slug]` (+ `/page/N`)   | ✅ Built — unpaginated + paginated tag archives, shared-tag related posts, per-tag RSS (#674); moved from `/tag/[slug]` and CMS-authored via the `page_tag` document since #1964 |
| Topics  | `/topics`                      | ✅ Built — hub listing every topic with post counts, links to archives (#750/#751/#752); CMS-authored via the `page_topicIndex` document since #1894                             |
| Page    | `/[slug]`                      | ✅ Built — generic page route (#285), slug space guarded by `RESERVED_SLUGS` (#328)                                                                                              |
| Feeds   | sitemap/robots/RSS             | ✅ Built — Phase 3 (#92), generic pages listed in the sitemap (#285); tag archives + per-tag RSS added in #674                                                                   |

Phase 3 (Blog core) is fully closed as of 2026-07-21 — every primary surface
built in that phase is merged. Post taxonomy (topic `max: 4` cap + the
`/tag/*` axis above) shipped as milestone M3 (#674) on 2026-07-23; the
topic cap was narrowed to a single required reference in #809 on
2026-07-24 (see §6 Content model). The whole axis was renamed from
`category` to `topic` — `_type`, post field and URLs — in #1812; `/category/*`
is **not** redirected and simply 404s.

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
- **Sanity Studio v6** (`sanity ^6`, `@sanity/cli ^7`) — `packages/studio`
- **Tailwind CSS v4** (shared token preset) + `tailwind-variants`
- **next-intl** for i18n (currently `en` only, `localePrefix: 'never'`)
- **groqd** query builder in the service layer
- **Neon Postgres + Drizzle ORM** (`packages/db`) — the non-Sanity relational
  store for the engagement layer (Auth.js, comments, ratings, bookmarks,
  subscribers); scaffolded in #984, see §4 and §15
- **Auth.js v5** (`next-auth@beta` + `@auth/drizzle-adapter`), configured once
  in `@blog/auth` and consumed by both apps — GitHub, Google, and
  email-magic-link sign-in against `@blog/db`'s adapter tables (database
  session strategy). The magic-link provider (`sendVerificationRequest` and
  its email-copy builders) lives in `@blog/auth`; each app supplies only the
  low-level Resend send transport (`apps/web/src/server/email/send-email.ts`,
  #1107), injected as `buildAuthConfig({ sendEmail })`
- **Vitest + Testing Library**; **Storybook** in `packages/ui` and `apps/web`
- **Turborepo + pnpm** workspaces; Node ≥ 20.19 (CI runs 22), pnpm 11.21

## 4. Workspace map & layer contracts

```
apps/
  web        Next.js frontend: routes, SEO, i18n, composition         (web)
  platform   Next.js admin panel: own deploy/domain, mounts Studio   (platform-app)
packages/
  studio     Sanity Studio library: schema, desk, migrations, mount   (@blog/studio)
  config     Cross-cutting constants, generated Sanity types,         (@blog/config)
             tokens, polymorphic React helpers (via /react subpath)
  service    Data access: Sanity client, groqd queries, transformers  (@blog/service)
  db         Relational data access: Neon + Drizzle; owns the         (@blog/db)
             vocabulary for the tables it stores (engagement, tenancy)
  auth       Shared Auth.js config both apps pass to NextAuth()      (@blog/auth)
  ui         Atomic Design component library (atoms→organisms)       (@blog/ui)
  utils      Framework-free helpers (async, primitives)               (@blog/utils)
  insight    Structured logger core (createLogger, LOG_LEVEL)         (@blog/insight)
configs/
  eslint, prettier, tailwind, tsconfig, vitest                        (@blog/*-config)
```

| Layer            | Imports                                                                                                             | Exposes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Must never                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@blog/config`   | —                                                                                                                   | Constants (UPPERCASE key/value pairs) — cross-cutting ones only; a storage layer's own vocabulary lives with that layer, see `@blog/db` — the `routes` URL builder (single source of URL truth), generated Sanity types + extracted schema, shared TS types, `/react` subpath for polymorphic prop helpers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | contain app logic; force React on non-React consumers (subpath!)                                                                                                                                                                                                         |
| `@blog/utils`    | `culori` (OKLCH color math)                                                                                         | Pure helpers (`safeAsync`, primitives, `oklchToHex`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | depend on any sibling                                                                                                                                                                                                                                                    |
| `@blog/insight`  | —                                                                                                                   | Structured logger core — `createLogger` (single-line JSON via `console.*`), `LOG_LEVEL`, and `sanitizeLogMessage`, the log-injection sanitizer (sole canonical implementation — `@blog/utils`'s former copy was removed once every call site moved onto this package). Consumed by both apps: `apps/web` and `apps/platform` each expose one shared logger at `src/utils/logger/logger.ts`, built with `createLogger` and its own `service` value, and import that rather than calling `createLogger` per module — the `service` field is what separates the two apps' lines downstream. `service`/`db`/`auth` never log; failures reach the caller, and the app layer logs them. `@blog/db`'s `sanitizeLogMessage` usage is a scoped exception — see footnote ².                                                                                                                                                                                                                                             | import React, Next.js, or any Sanity SDK; depend on any sibling                                                                                                                                                                                                          |
| `@blog/service`  | `config`, `utils`, Sanity SDKs                                                                                      | The versioned `service` facade (`service.pages.post.v1.getPost(slug)` …), view-model types (`TPostDetail`, `THomePage`, …), `urlForImage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | import React or `@blog/ui`; return raw Sanity docs; fake defaults                                                                                                                                                                                                        |
| `@blog/db`       | `config`, `utils`, Drizzle/Neon SDKs (+ `@sanity/client`, scoped¹; `@blog/insight`'s `sanitizeLogMessage`, scoped²) | Typed query/mutation functions over Neon Postgres (Auth.js adapter tables, comments, ratings, bookmarks, subscribers, the `tenants`/`tenant_domains`/`memberships`/`membership_invites` registry, the global `admins` table, the tenant-scoped `site_config` and `settings_features` tables, and the append-only `audit_events` log) — the relational sibling to `service`, not a dependent of it. Also owns the vocabulary for the tables it stores (`TENANT_STATUS`, `TENANT_PLAN`, `PLAN_REGISTRY`, `MEMBERSHIP_ROLE`, `ADMIN_ROLE`, `GRANTED_VIA`, `TENANT_PROVISIONING_*` — some `pgEnum`-backed, some plain typed columns), reachable from the package root and, for client components, from `@blog/db/constants`. That subpath resolves through the workspace's standard `@blog/db/*` alias, not a curated `exports` entry, and nothing enforces the split: a client component importing the root barrel breaks the Next build, because the barrel re-exports `client.ts` and its `server-only` import | import React, `@blog/ui`, `@blog/service`, or any Sanity SDK outside the scoped exception below; be imported by `studio`/`service`/`ui`                                                                                                                                  |
| `@blog/auth`     | `db`, `config`, `utils`, `next-auth`/`@auth/*`                                                                      | The Auth.js configuration both apps pass to their own `NextAuth()` call — providers, the Drizzle adapter over `db`'s tables, `database` session strategy, cookie options (only the session cookie's cross-subdomain `Domain`, and only when the optional `AUTH_COOKIE_DOMAIN` is set — unset, no `cookies` key is returned at all, which is the correct state locally and on any `*.vercel.app` origin), and the `session` callback plus module augmentation that put `user.id` on `session.user` (type and fulfilling logic kept together so an app cannot inherit the type without the value). Exports configuration, never a constructed NextAuth instance.                                                                                                                                                                                                                                                                                                                                                | import React components, `@blog/ui`, `@blog/service`, or Sanity; be imported by `@blog/db`; decide authorization                                                                                                                                                         |
| `@blog/ui`       | `config` (types + tokens)                                                                                           | Atomic-design components up to organisms (pure, prop-driven, polymorphic `as`/`linkAs` slots). No template layer — page composition belongs in `web`. Prop types are **closed** — each component enumerates exactly what it supports, rather than inheriting the DOM surface; see §18.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | import `service`/`sanity`/`fetch`; use `'use client'`; `extends` a DOM prop set or spread `...rest` onto an element (§18)                                                                                                                                                |
| `@blog/studio`   | `config` (constants), `utils`                                                                                       | Sanity Studio **as a library, not a deployed app** — schema types (source of truth), desk structure, content migrations, and the `StudioMount` component, which takes plain string props (`projectId`, `dataset`, `basePath`, `title`) and builds the Studio config internally. `apps/platform` mounts it; that is what lets one Studio serve every tenant. The one package permitted a `'use client'` directive, scoped to that component.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | hand-write shapes typegen should produce; export a _built_ Studio config object — a Server Component calling the builder drags the Sanity SDK into the RSC graph, where `swr`, `sanity`'s bundled CSS and `sanity-plugin-media` break under the `react-server` condition |
| `web` (app)      | `ui`, `service`, `db`, `auth`, `config`, utils                                                                      | Routes, metadata, feeds, i18n, page composition; owns `PortableTextRenderer` and all framework-coupled wrappers (`SanityImage`, `SmartLink`, theme toggle)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | write GROQ; import Sanity SDKs; put data logic in components                                                                                                                                                                                                             |
| `platform` (app) | `db`, `auth`, `config`, `utils`, `studio` (+ `@blog/ui`, scoped³)                                                   | Operator/tenant admin panel — its own deployment and domain, running the same Auth.js configuration as `web` via the shared `@blog/auth` package (a shared config, not a shared sign-in: each origin holds its own session — see the `AUTH_COOKIE_DOMAIN` note below). Routes, Server Actions, and Base UI form surfaces, styled from its own presentational primitives (Text, Card, Icon, Button, …) rather than `@blog/ui`. Its own UI copy runs through `next-intl`, mirroring `web`'s convention (`apps/platform/src/i18n/`, single `en.json` to start) — decided 2026-08-14; retrofit of existing hardcoded strings is tracked separately, not a blocker on other admin work.                                                                                                                                                                                                                                                                                                                            | import Sanity SDKs or `@blog/service` **directly** — mount `@blog/studio` instead; add components to `@blog/ui`; import `@blog/ui` outside the scoped exception below                                                                                                    |

The graph is acyclic. `apps/web` is the only place `ui`, `service`, and `db`
meet — `db` and `service` are parallel data layers (Neon vs. Sanity) that
never reference each other; a feature needing both joins them in `web`.
`apps/platform` consumes `db` but never `service`, so it is a second
consumer of `@blog/db` without being a second place those three meet. Both apps
also consume `@blog/auth`, which sits above `db` and holds the single Auth.js
configuration they share — that sharing is what lets a session issued by one
be accepted by the other, so the two must never maintain it separately.
Whether a single sign-in also _spans_ the two origins is a separate question,
governed by `AUTH_COOKIE_DOMAIN`; it is deliberately left unset, so each
origin keeps its own session and is signed into independently
(`docs/context/environment-variables.md`).
Full contract and migration mechanism: `.claude/agents/db.md`.

¹ `@blog/db`'s Sanity-SDK prohibition has one scoped exception:
`packages/db/scripts/provision-tenant/` talks to Sanity's Management API
directly (via `@sanity/client` for content seeding, raw `fetch` for the
project/dataset/CORS/webhook management calls) to create a new tenant's
Sanity project/dataset/CORS entry, invite the tenant owner (resolved from
their OWNER `memberships` row, falling back to a pending OWNER
`membership_invites` row) as a `viewer` project member, seed its starter
content, and create a revalidation webhook (pointing at `apps/web`'s shared,
already tenant-aware revalidate endpoint) during provisioning — the one
place in this package that talks to Sanity rather than Neon. The invite role
is `viewer` because `SANITY_MANAGEMENT_TOKEN` lacks permission to grant
`administrator`, which is the role the owner actually needs; an operator
raises it by hand in Sanity's Manage UI once the owner accepts. Invite
failures are logged and do not fail the step — a membership problem must not
cost the project, dataset, seeded content and webhook alongside it.
Enforced by a dedicated `configs/eslint/db.js` override scoped to that
directory; every other path in
`@blog/db` keeps the blanket prohibition.
Dependency-graph enforcement details and SVG/type-flow wiring:
[`docs/context/frontend-conventions.md`](./docs/context/frontend-conventions.md).

² `@blog/db`'s "never log" rule has one scoped exception, decided on
#2120: `packages/db/scripts/provision-tenant/`,
`packages/db/scripts/deprovision-tenant/`, and
`packages/db/scripts/recheck-tenant-owners/` — standalone CLI tools run via
`tsx`, outside the request-handling path the rule targets — import
`@blog/insight`'s `sanitizeLogMessage` (the sanitizer only, not
`createLogger`) directly, rather than keeping their own copy of it. The rest
of `@blog/db` (its `src/` library code, consumed by `apps/web`/`apps/platform`
at request time) is unaffected and still never imports `@blog/insight`.

³ `apps/platform`'s `@blog/ui` prohibition has one scoped exception:
`apps/platform/src/components/features/look/look-preview/preview-sample/`
renders the tenant's real site (`WindowChrome`, `BrandMark`, `Text`,
`Button`) so the live theme preview doesn't drift from what `apps/web`
actually looks like. An ESLint `no-restricted-imports` override in
`configs/eslint/platform.js` confines `@blog/ui` imports under `apps/platform` to
that one directory; every other admin surface uses admin's own primitives.

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

Source of truth: `packages/studio/src/schema-types/` — documents (`post`, `author`,
`topic`, `tag`, page documents, singletons), standalone `module_*`
page-builder documents, and shared objects (`link`, `imageWithAlt`, `bodyImage`,
`seo`, `aside`, `skim`, …). Naming convention `{group}_{name}` is being applied
incrementally (#251).

Every `module_*` document also carries a **required** `brandVariant` field
(stored values from `@blog/config`'s `BRAND_VARIANT` const —
`PRIMARY`/`SECONDARY` for `module_content`/`module_newsletter`/
`module_postList`/`module_postLatest`/`module_taxonomyList`; `module_hero`
and `module_cta` additionally allow `BRAND_PRIMARY` — on `module_cta` this
field means the card's own fill tone (Banner/Split/Callout below), not the
full-bleed band tone every other module uses it for), plus an optional, all-remaining-fields-optional `layout`
object (`spacingTop`/`spacingBottom`, `containerWidth` (not on
`module_hero`, which uses the leaner `heroLayout` type), `dividerTop`,
`dividerBottom` — stored values from `SPACING_SCALE`/`CONTAINER_WIDTH`
consts; there is no `align` field on `layout` — see `SectionHeader` below
for heading alignment).
`module_cta`/`module_postList`/`module_postLatest`/`module_taxonomyList`/`module_newsletter`
additionally carry a `sectionHeader` object (`heading`, `supportingText`,
`align` — stored values from `HEADING_ALIGN`; all optional on
`module_postList`/`module_postLatest`/`module_taxonomyList`, `heading` required on
`module_cta`/`module_newsletter` via a per-module `requireHeading` override
on the shared `sectionHeaderField()` helper). `module_content` has no `sectionHeader` —
its rich-text `body` supplies any in-content headings, so a separate
structured heading field would just be a second way to do the same thing.
`module_hero` has no `sectionHeader` either — its heading fields are its
own dedicated schema, unrelated to this shared shape.

`module_cta` additionally carries a required `variant` (`BANNER`/`SPLIT`/
`CALLOUT`, from `CTA_VARIANT`, default `CALLOUT`), an optional `eyebrow`,
an optional `content` (`basicText` — a constrained Portable Text block:
paragraphs, bullet/numbered lists, bold/italic, and `link` annotations
only, no headings/images/code/asides — distinct from the fuller `richText`
used elsewhere), an optional `image` (`imageWithAlt`, required for
`BANNER`/`SPLIT` via a custom validator, since Sanity can't make
`.required()` conditional on a sibling field), `imageSide`/
`mobileMediaOrder` (Split only), an optional `actions` (`actionGroup` — a
reusable object under `objects/blocks/`, not CTA-specific: an `actions`
array of `ctaAction` items, each with its own `variant` (`PRIMARY`/
`SECONDARY`) and `appearance` (`CONTAINED`/`INLINE`, available on either
variant), validated so a `PRIMARY` item is required and comes first,
`SECONDARY` is optional, max two), and an optional `footnote`.

`module_taxonomyList` is excluded from `MODULE_MAP`, so it never reaches
`ModuleRenderer`; it still carries a `REVALIDATE_TAGS` entry, which every
module type requires regardless of how it is rendered. It renders through a
taxonomy index page's own required slot — `page_topicIndex.taxonomyList` on
`/topics`; `page_tagIndex` on `/tags` follows the same shape. Which taxonomy it
lists is not an authored field: it is inferred from which index page's slot
holds the module — the same inference-by-slot rule the post list uses — and the
page passes that kind to
`service.modules.taxonomyList.v1.getTaxonomyList(id, taxonomy)` rather than the
loader querying upward for its parent page.

`service.modules.<type>.v1` projects `brandVariant` as a required
`TBrandVariantOf<...>` (narrowed per module to exactly the options its
schema allows), `layout` as `TLayout | undefined`, and (where applicable)
`sectionHeader` as `TSectionHeader | undefined` — with no faked defaults on
either: unset stays unset end to end. In `apps/web`, every module component
that renders a `@blog/ui` organism — including those reached through a
dedicated slot rather than `MODULE_MAP`'s generic `ModuleRenderer` pipeline
(§5 above): `module_hero` via the home template's `hero` slot,
`module_postList` via `page_blog`'s `postList` reference (and, since #1915,
`page_topic`'s own `postList` reference on `/topics/[slug]`, and since #1964,
`page_tag`'s own `postList` reference on `/tags/[slug]`), and
`module_taxonomyList` via `page_topicIndex`'s `taxonomyList` reference, all
still styled the same way as every other module — no exception — wraps it in `apps/web`'s own
`Section` component (`apps/web/src/components/shared/section`, relocated
from `packages/ui`), passing `brandVariant` and `layout` straight through,
plus an optional `titleId` (the module's heading element id, when it has
one). `Section` always renders a real `<section>`; its outer element owns
the full-bleed background (driven by `brandVariant`) and vertical spacing as
responsive padding (not margin, so stacked `Section`s tile edge-to-edge; the
`spacingTop`/`spacingBottom` scale steps down at each Tailwind breakpoint,
`px-gutter` unaffected), plus `dividerTop`/`dividerBottom` border rules; its
inner `<div>` owns `mx-auto` + gutter + `containerWidth`'s max-width,
holding the wrapped organism as bare content (the four other organisms —
`content-module`/`cta-module`/`posts-section`/`hero` — no longer render
their own `<section>` landmark; `Section` is the sole landmark owner for
every module). `titleId` is optional — `aria-labelledby` is only rendered
when supplied, so a module with no unique heading (`module_content`) gets a
landmark with no accessible-name fallback rather than pointing at an element
that never renders.

`module_cta` is the one deliberate exception to "passing `brandVariant`
straight through": `cta-module-view.tsx` pins `Section` to `PRIMARY`
regardless of the authored value, and passes the authored `brandVariant` to
`CtaModule` as its own `tone` instead — the card's fill (Split/Callout) or
overlay-scrim tint (Banner), painted by `CtaModule` itself rather than by
`Section`. For `BANNER`, `CtaModule` additionally breaks out of `Section`'s
always-constrained inner `<div>` (no `containerWidth` option removes its
max-width) via a CSS technique independent of `Section`'s own padding
values, rendering genuinely full-bleed; `SPLIT`/`CALLOUT` stay bounded,
rounded cards inside `Section`'s inner container like every other module's
organism. `Section` itself is unmodified either way — the exception lives
entirely in how `CtaModule` uses the space `Section` gives it.

**Theme-as-content** (Phase 2 of the configurability epic, #1285/#1287,
storage cut over to Postgres by the config-to-Postgres transition's E5): a
tenant's row in `@blog/db`'s `site_config` table (`preset` —
`PRESET_ID.CONSOLE`/`EDITORIAL`, required, plus `accentHue`/`logoHue`/
`headingFont`/`bodyFont`/`radiusScale`/`density`) is read via
`apps/web/src/server/site-config/get-site-config.ts` and resolved by
`apps/web/src/utils/to-theme-tokens.ts` against `@blog/config`'s
`PRESET_REGISTRY` into a fully-populated `TThemeTokens` (never partial —
every gap, and the case of no row existing at all, is filled by the preset's
own default). `apps/web`'s root layout fetches this once per request
(`unstable_cache`-wrapped, tagged `site-config`) and injects the resolved
tokens as a server-rendered `<style>` block declaring CSS custom properties
under both `:root` and `.dark`, and selects the matching `next/font/google`
pair (`headingFont`/`bodyFont`) via a per-font dynamically imported loader
module so only the two fonts actually resolved for that render are
bundled/preloaded. `apps/web/src/proxy.ts` resolves the request's tenant from
its `Host` header against `@blog/db`'s `tenant_domains`
(`resolveTenantId()`, `apps/web/src/server/tenant/`), falling back to the
sole `tenants` row outside production (`isProductionEnvironment()` — never
`NODE_ENV`, which is `production` on every Vercel build including the live
`blog-web-dev` deployment) and 404ing on an unmatched host in production; the
resolved `tenantId` is threaded to Server Components/Actions via the
`x-tenant-id` request header (unconditionally cleared before the conditional
set, so a client-supplied value can never survive an unresolved lookup),
read back with `getRequestTenantId()`. `get-site-config.ts` is a deliberate
exception: it backs the theme/voice reads below via a fixed-cache-key
`unstable_cache` read on nearly every route (including statically rendered
ones), so wiring it to the per-request header would force those routes out
of static rendering — a larger, sitewide tradeoff with no settled design yet
(unresolved, not scoped into any existing epic). It keeps its own private
sole-tenant resolution (`resolveSiteConfigTenantId`) until that tradeoff is
decided. The Sanity `settings_theme` schema this superseded is
retained only as a rollback path (unused by any read path) until the
transition's retirement epic deletes it. The favicon route
(`apps/web/src/app/icon.tsx`) fetches through the tenant's uploaded
`settings_site.brand.logo` as a small square crop when present, falling back
to one static default mark with no per-tenant recoloring. The former
`siteSettings.brand.variant`/`BRAND_VARIANT` binary look toggle (and its
`.indigo` CSS class) is retired in favor of this — its one prior look
("Indigo") is now expressible as a theme override (`accentHue`/`logoHue`)
rather than a separate axis; migrating existing `INDIGO`-variant content and
removing the field itself is tracked separately (#1389) since it's a
live-data migration, not a schema-only change.

**Voice-as-content** (the config-to-Postgres transition's E4/E5, wired live
for the first time by E5): `apps/web/src/i18n/request.ts` resolves each
request's `next-intl` messages as a three-layer merge — the neutral base
(`i18n/messages/en.json`, neutralized per #1420) ← the resolved preset's
`voicePack` (`@blog/config`'s `PRESET_REGISTRY[preset].voicePack`, via
`deepMergePartial`) ← the tenant's `site_config.voiceOverrides`. The
`preset` and `voiceOverrides` come from the same `site_config` row and the
same cached read as theme (`get-site-config.ts`, tag `site-config`) — one
row backs both. `voiceOverrides` stores its 19 curated fields as flat
camelCase keys (e.g. `notFoundCommandNotFound`), matching `apps/platform`'s
Voice tab (`apps/platform/src/utils/voice-fields/voice-fields.ts`);
`apps/web/src/utils/apply-voice-overrides.ts` maps each flat key back to its
nested message path and applies it last, cloning only the objects along
that path so untouched namespaces keep referencing the cached messages
module instead of being mutated in place. A fetch failure, or a tenant with
no `site_config` row, falls back to the `CONSOLE` preset with no overrides
— never a thrown error or an empty page. Same `get-site-config.ts` caveat as
theme, above: this reads the sole `tenants` row rather than the real
`proxy.ts` resolution, pending the tenant-scoped caching design.

`get-site-config.ts`'s cache carries a 3600s (`SITE_CONFIG_REVALIDATE_SECONDS`)
fallback window as its safety net, but `apps/platform`'s Look/Voice save actions
(`update-look-action.ts`/`save-voice-overrides-action.ts`) also POST to
`apps/web`'s `POST /api/revalidate-site-config` after a successful
`site_config` write, so a tenant admin's save reflects on the live site
within seconds rather than waiting out that window. This is a plain
shared-secret (`SITE_CONFIG_REVALIDATE_SECRET`, which must be byte-identical
between the two apps because `apps/web` compares the bearer token it receives
against its own copy — unlike `AUTH_SECRET`, where matching is an operational
stance rather than a verified dependency) service-to-service call between the
two apps' own deployments — not a Sanity webhook, so it doesn't reuse
`@sanity/webhook`'s HMAC verification. Calling it is best-effort from the
platform side: a failure (missing config, network error, non-2xx) is logged and
swallowed, never thrown, since the save itself has already succeeded and the
3600s window still covers it. See
[`docs/context/environment-variables.md`](./docs/context/environment-variables.md)
and [`docs/context/rendering-caching-i18n.md`](./docs/context/rendering-caching-i18n.md).

**Feature-toggle layer** (Phase 4 of the configurability epic, #1285/#1289):
`@blog/db`'s `settings_features` table (one row per tenant, five `NOT NULL`
boolean columns — `commentsEnabled`/`ratingsEnabled`/`bookmarksEnabled`/
`newsletterEnabled`/`analyticsEnabled`) holds the tenant's own on/off choice
for each of `@blog/config`'s `CAPABILITY` keys. It is never eagerly seeded at
tenant-provisioning time — like `site_config`, an absent row is resolved
lazily at read time by falling back to the tenant's current preset's
`PRESET_REGISTRY[preset].featureDefaults` (`comments`/`ratings`/`bookmarks`
default on, `newsletter`/`analytics` default off — a deliberate opt-in
posture for the two `GROWTH`-only capabilities, not a "match legacy
behavior" default). Two gating layers stack on top of the tenant toggle,
most-restrictive-wins: env-locked secrets (unchanged, pre-existing —
`AUTH_*`, `ANTHROPIC_API_KEY`, `SANITY_REVALIDATE_SECRET`, …) and
`@blog/db`'s `PLAN_REGISTRY` (`Record<TTenantPlan, TCapability[]>` — `FREE`
entitles `comments`/`ratings`/`bookmarks`; `GROWTH` entitles all five).
`PLAN_REGISTRY` lives in `@blog/db`, not `@blog/config`, despite mirroring
`PRESET_REGISTRY`'s shape: it keys off `TENANT_PLAN`, which `db` owns per
its storage-layer-vocabulary exception, and `config` sits below `db` in the
dependency graph so it cannot import that type — while both consumers
already depend on `db` directly. `apps/web`'s
`is-capability-enabled.ts` (`apps/web/src/server/settings-features/`)
resolves the two-layer check per request and never throws; a disabled
capability is omitted silently at its own render site (`module_newsletter`
in `ModuleRenderer`; the bookmark button on the post-detail page; Vercel
Analytics/Speed Insights in the root layout, ANDed with the pre-existing
`WEB_ANALYTICS_ENABLED` env gate) — same pattern as an unknown module type,
never a thrown error or a visible placeholder. `comments`/`ratings` have no
render site yet in `apps/web` (no comments/ratings feature exists anywhere
in the codebase today); their toggles and plan entitlement are wired
end-to-end regardless, ready for whichever future epic ships those features.
`apps/platform`'s Features tab mirrors the Look/Voice tabs — its Server Action
independently re-validates plan entitlement server-side before writing any
toggle, rejecting the whole save if a submitted toggle exceeds the tenant's
plan, since a disabled client control is never the real gate. Validation
limits and layout thresholds (mentioned in the original phase scope) were
cut with no concrete values ever specified; tracked separately (#1920).

**Curated UI copy lives in Voice, not on modules.** Empty-state and other
curated UI strings have exactly one authorable home: `settings_voice`'s
`emptyStates` group (`blogListEmpty`, `topicEmpty`, `tagEmpty`, …), applied
via the merge above. A module-level field for the same copy (e.g. a
`module_postList.emptyMessage`, removed in #1899 for exactly this reason)
creates a second, uncoordinated home that silently wins over the tenant's
Voice override with no error or warning — the worst failure mode for a
settings surface. Any future module needing curated copy renders the i18n
key directly; it does not grow its own override field.

Full schema reference (every document/object, field-by-field), naming and
validation conventions, incl. the `layout`/`sectionHeader` objects' own
field lists:
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

Full migration tooling (`packages/studio/migrations/`, the `migrationState` ledger,
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

Cache tags can be tenant-scoped (`t:<projectId>:<tag>`, alongside the legacy
unprefixed form); the revalidation webhook purges both per publish, keyed off
Sanity's own `sanity-project-id` webhook header. The same webhook also cleans
up orphaned `@blog/db` `bookmarks` rows when it receives a `blog_post` delete
(Sanity's `sanity-operation` header — unpublish fires the same trigger as
true deletion), scoped to the tenant resolved from that project-id header.
`@blog/service`'s
`getClient()`/`runQuery()`/`isr()` all take an optional tenant context —
called with none, they behave exactly as before (legacy single-tenant client,
unprefixed tags), which is what keeps every not-yet-migrated `service.*`
loader compiling and working unchanged while the migration proceeds
loader-by-loader.

Client-side error capture is a self-hosted route, not a third-party SDK
(`web`'s Lighthouse performance budget rules out shipping an SDK on every
page view): `app/error.tsx`/`app/global-error.tsx` report render failures on
mount, and the two existing explicit client catches report alongside their
`logger.*` calls, all via `@web/utils/report-client-error`
(`navigator.sendBeacon`, falling back to `fetch(..., { keepalive: true })`;
deduped by fingerprint and circuit-broken per page load) to
`POST /api/client-log` — the app's first unauthenticated public write
endpoint. That route enforces a `.strict()` Zod schema with a fixed field
set (unknown keys rejected), a payload-size cap enforced on the request
stream itself (not just the caller-supplied `Content-Length` header), and an
in-memory rate limiter — the repo's only rate limiter today, and explicitly
**per serverless instance**, not a cross-instance guarantee (a client whose
requests land on different Vercel instances gets a fresh counter on each
one). `window.onerror`/`unhandledrejection` are deliberately out of scope.

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

| Concern                  | Development                       | Production                         |
| ------------------------ | --------------------------------- | ---------------------------------- |
| Sanity project           | separate dev project (id via env) | separate prod project (id via env) |
| Sanity dataset           | `development`                     | `production`                       |
| Neon branch (`@blog/db`) | `development`                     | `production`                       |
| Vercel project (web)     | `blog-web-dev`                    | `blog-web-prod`                    |
| Vercel project (admin)   | `platform-dev`                    | `platform-prod`                    |
| Admin hostname           | `admin-dev.{your-hosting}`        | `admin.{your-hosting}`             |
| Deploy trigger           | push/merge to `main`              | push git tag `v*`                  |
| Web deploy mechanism     | Vercel CLI in GitHub Actions      | Vercel CLI in GitHub Actions       |
| Admin deploy mechanism   | Vercel CLI in GitHub Actions      | Vercel CLI in GitHub Actions       |
| Revalidation webhook     | dev webhook → dev site            | prod webhook → prod site           |

- `main` is a continuous **staging line** (auto-deploys to development, which is
  also the local-dev dataset); a **`vMAJOR.MINOR.PATCH` git tag** promotes that
  exact commit to production. Content migrations run inside the gated prod
  deploy (`verify → migrate → deploy`), never ahead of the migrated data.
  `@blog/db`'s Drizzle/Neon schema migrations run the same way, alongside the
  Sanity ones, via their own `migrate-db` job in both deploy workflows (dev:
  automatic; prod: backed up via `pg_dump`, gated behind the same required-
  reviewer approval) — see `docs/DEPLOY.md` and `.claude/agents/db.md`'s
  "Migrations" section.
- **Neon Postgres is one project with two branches, not a project-per-environment
  split like Sanity**: `main` backs production, `development` (branched off
  `main` on 2026-08-25) backs development. Before that date only `main`
  existed and both environments read it. `deploy-production.yml`'s
  `migrate-db` job reads the `production` Environment's own
  `DATABASE_URL_UNPOOLED` (`main`); the tenant-provisioning workflows
  (`provision-tenant.yml`/`deprovision-tenant.yml`) read their own
  `TENANT_REGISTRY_DATABASE_URL_DEV`/`_PROD` secrets instead (#2056, merged
  2026-08-25) — before that split, both purposes shared one secret, and
  pointing it at `development` for tenant provisioning had silently
  repointed production migrations at `development` too. The dev `migrate-db`
  job now guards against the same class of mistake for its own secret: it
  compares its resolved connection host against the production branch's
  host (mirrored into a repo Variable, since a job scoped to one GitHub
  Environment can't read another's secrets) and refuses to migrate if they
  match (#2057). The prod `migrate-db` job carries the mirror-image guard
  (#2264): it fails if its own resolved host does **not** match the same
  repo Variable, so a mis-set production secret can no longer migrate the
  wrong Neon branch — or nothing at all — while reporting success. Whether
  `blog-web-dev`'s Vercel `DATABASE_URL` scope is correct is still open (#2058).
  See `docs/DEPLOY.md`'s Neon Postgres section for the full state and open
  items.
- **Each environment is a separate Sanity project** with its own env-driven,
  never-committed project id and tokens; **four fully isolated Vercel
  projects** (a web project and an admin-panel project per environment), all
  with Git auto-deploy disabled via their own `vercel.json`'s
  `git.deploymentEnabled: false` — deploys only run via the Vercel CLI from
  GitHub Actions, so there are no PR preview deploys and a `main` push can
  never reach production. The Studio has no Vercel project, hostname or
  deploy job of its own: it ships as the `@blog/studio` package and is
  mounted by the admin panel, which is what lets one Studio serve every
  tenant. Neither `*.sanity.studio` hosting nor `sanity deploy` is used.
- `@blog/ui`'s Storybook is hosted separately (`blog-storybook` Vercel
  project, `ui-library.{your-hosting}`) via Vercel's Git integration with PR
  previews — a deliberate exception to the CI-gated, no-preview pattern
  above, since it carries no Sanity data or credentials. `apps/web`'s own
  Storybook mirrors this as a second such exception: a separate,
  root-Directory-scoped Vercel project (`web-storybook.{your-hosting}`,
  config in the repo-root `vercel.json` rather than `apps/web/vercel.json`,
  which stays claimed by the CI-gated main site deploy) with the same
  Git-integration/PR-preview setup. See
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

## 17. Observability & logging

The logger core is `@blog/insight` (`createLogger`, `LOG_LEVEL`) — a
zero-dependency package at the base of the graph alongside `config`/`utils`.
Each app owns **one** shared logger at `src/utils/logger/logger.ts`
(`createLogger({ service: 'web' | 'admin' })`) and imports it; modules never
call `createLogger` themselves, because the `service` field is what separates
the two apps' lines downstream. Output is single-line structured JSON to
stdout — stdout is the transport, so there is no logging framework.

`service`, `db`, and `auth` **never log**. They return the failure to the
caller, and the app layer logs it once, with request context. A failure logged
in two layers is one failure that looks like two.

Event names are static, lowercase and dot-namespaced (`tenants.create_failed`).
Dynamic values — slugs, ids, domains, status codes — are structured context
fields, never interpolated into the name. A static name is what makes failures
groupable, and it is also the log-injection barrier CodeQL checks. Two distinct
failure sites get two distinct names, even in the same file.

### What belongs in the log stream

**Log the gap between what the user was told and what actually happened. No
gap, no log.**

A log line exists for someone who is not present at the moment of failure and
cannot see what the user saw. So the test is not whether a failure was shown in
the UI — it is whether the UI message already contains what a diagnostician
would need:

- The message _is_ the whole truth and the reader can fix it themselves — a
  validation error, a duplicate slug, a not-found on a user-supplied URL. There
  is no gap. Do not log it; it is a return value, not a failure.
- The message is deliberately vague — "Couldn't create the tenant — try
  again" — precisely because the cause is not something to show an operator.
  The gap is total, and the log is the only place the cause exists anywhere.

This inverts the intuition usefully: **the vaguer the user-facing message, the
more necessary the log line.** A specific message means the system understood
the failure and handed it to someone who can act; a generic one means it did
not.

Two corollaries. A failure crossing a boundary we do not control (Sanity,
Vercel, a CI callback) is logged even when surfaced, because the remote detail
cannot be shown and cannot be reproduced afterwards. And anything asynchronous
is logged regardless, because there may be no one watching at all.

### Levels

Pick by who can act on the line. `error` — something is broken and a human
needs to look. `warn` — handled, but worth seeing: a fallback engaged, a retry,
a degraded path taken. An expected, user-correctable outcome is never `error`;
it fires alerts nobody can act on and buries real breakages in routine noise.

**A `TResult` failure is not automatically an `error`.** Since expected
failures became values rather than exceptions, the instinct to log every
`!result.ok` uniformly is the main way routine input errors reach the error
rate. Branch on the `ERROR_CODE` first; log only the branches a human would do
something about.

`ERROR_CODE` is not the only discriminator. Where a "not found" is an ordinary
outcome rather than a failure — a page document looked up by a user-supplied
slug — the loader models it as a **successful result carrying no data**
(`ok: true`, `data: undefined`) instead of a coded failure, and `ok: false` is
left to mean a genuine failure. The page loaders in `@blog/service` work this
way: their outer GROQ query is nullable, so a missing document returns
`undefined` rather than throwing, and the app 404s without logging. A document
that exists but is misconfigured — a required module slot left unset — still
throws, still surfaces as `ok: false`, and still logs. The rule underneath is
unchanged: a stale link is the reader's whole truth and needs no line; a broken
page is not.

**A consumer that treats `ok` as a proxy for "the document exists" is a
migration hazard.** When a loader moves from throwing to returning `undefined`,
every `result.ok`-only check silently flips meaning, and `type-check` cannot
see it because `.ok` is still a valid boolean. Gate on the data.

### Logging is not auditing

The rule above is about diagnostics, and it deliberately leaves business
questions — "who archived this tenant, and when?" — unanswered. Those belong
in durable, queryable, append-only relational data, not in the log stream: logs
expire, cannot be queried by business key, and carry no integrity guarantee.
Answering audit questions with log retention turns the pipeline into an
expensive, lossy database, and couples noise-reduction work to compliance.

### Where logs land

Server logs go to Vercel Runtime Logs, per project, with a build-time vs
runtime split for static and ISR routes. `apps/web` captures client-side errors
through its own `/api/client-log` endpoint rather than a third-party browser
agent, to protect the Lighthouse budget on public pages. A drain to
Grafana Cloud Loki is the intended destination and is not yet wired up.

## 18. `@blog/ui` prop contract

`@blog/ui` exists primarily to serve `apps/web`, so its prop types are
**closed**: each component enumerates exactly what it supports, composing
`IWithClassName` and `IWithDataTestId` from `@blog/config`. A component never
`extends` a DOM prop set and never spreads `...rest` onto its element.

Three tiers:

1. **Closed — the default.** Own props plus `className` and `dataTestId`.
   Attributes the component must control (`role` on a menu item, `aria-hidden`
   on a decorative icon) are simply absent from the type, so a caller cannot
   pass them at all — rather than passing them and having the outcome decided
   by where the spread happens to sit.
2. **Polymorphic — the sanctioned exception.** Components that forward to a
   caller-chosen element keep `TPolymorphicProps<C, Own>` and its spread.
   Forwarding is their entire contract, so the open surface is the point.
3. **Named escape hatch.** Where a consumer genuinely needs a native
   attribute, the component names that single prop. The surface is never
   reopened to obtain one.

Boolean props are prefixed `is`/`has`/`can`/`should`.

**Why.** A wide prop type accepts attributes the component never styles, so
the mismatch reaches the user as missing behaviour rather than reaching the
author as a type error. A closed type has no such gap: the surface and the
styling are the same list.

**`className` carries layout, not appearance** — margins, width, flex/grid
placement, the things only the parent can know. Appearance belongs to the
component's own variants. A consumer restyling internals through `className`,
or through a `[&>child]:` selector, means a variant is missing; add the
variant.

Both conventions are lint-enforced rather than left to review — see the
repo-specific ESLint rules in
[`docs/context/claude-code.md`](./docs/context/claude-code.md). The
per-component how-to, including the `tv()` and slot conventions that go with
this, lives in `.claude/skills/ui-library-practices`.
