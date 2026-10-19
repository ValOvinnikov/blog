---
title: Rendering and caching
status: built
layers: [service, web, config, platform, db]
code:
  - packages/service/src/sanity/query/isr.ts
  - packages/service/src/sanity/client/client.ts
  - packages/config/src/constants/cache.ts
  - apps/web/src/app/api/revalidate/**
  - apps/web/src/app/api/revalidate-site-config/**
  - apps/web/src/server/revalidate/**
  - apps/web/src/utils/revalidate-tags/**
  - apps/web/src/utils/tenant-cache-tags/**
  - apps/web/src/utils/build-post-publish-paths/**
  - apps/web/src/server/site-config/get-site-config/**
  - apps/web/src/server/settings-features/get-tenant-plan/**
  - apps/web/src/server/settings-features/get-effective-settings-features/**
  - apps/platform/src/server/site-config/revalidate-site-config.ts
  - scripts/check-revalidate-tags-sync.mjs
epics: []
---

# Rendering and caching

## What it does

Public pages are rendered on their first request per tenant, language and path, then served from Next's Full Route Cache. Sanity reads and tenant-config reads sit in the Data Cache under tags. Publishing in the Studio fires a signed webhook that expires the affected tags and paths immediately; a Look, Voice or Features save in the platform calls a second endpoint that does the same for that tenant's config. Time-based expiry bounds how long a missed purge can stay visible.

## Surfaces and routes

- `POST /api/revalidate` — Sanity publish/unpublish/delete webhook (signature-verified).
- `POST /api/revalidate-site-config` — called by `apps/platform` after a Look, Voice, Features, tenant-details or languages save (Bearer secret, optional `{ tenantId }` body).
- Every content route under `apps/web/src/app/[tenant]/[locale]/` declares `export const revalidate = 21600`, and every route with a dynamic segment (`[...slug]`, `blog/[slug]`, `blog/page/[page]`, and the topic and tag slug and pagination routes) declares an empty `generateStaticParams`, so none of them is prerendered at build and each path is cached on first request. The `[tenant]/[locale]` layout's `generateStaticParams` returns the default locale only.
- `account` and `bookmarks` are `force-dynamic` and never cached across readers.

## Data

- **Sanity Data Cache** — every `@blog/service` loader passes `isr(tags, projectId)`, which emits `revalidate: 3600` (`SANITY_CONTENT_REVALIDATE_SECONDS`) and tags prefixed `t:<projectId>:<tag>`. With `SANITY_LIVE_CONTENT=1` in development it returns `cache: 'no-store'`. The Sanity client runs with `useCdn: false`.
- **Tenant config Data Cache** — `getSiteConfig`, `getTenantPlan` and `getEffectiveSettingsFeatures` wrap their `@blog/db` reads in `unstable_cache`, tagged `site-config:<tenantId>`, `tenant-plan:<tenantId>` and `settings-features:<tenantId>`, `revalidate: 3600` (`TENANT_CONFIG_REVALIDATE_SECONDS`).
- **Full Route Cache** — `CONTENT_ROUTE_REVALIDATE_SECONDS` (21600) is the backstop; each route hardcodes the literal.
- **`REVALIDATE_TAGS`** (`apps/web/src/utils/revalidate-tags`) maps a document `_type` to the tags its publish purges. Module types also purge `module:<id>`; any module whose markup embeds the published document is found through `service.entities.modules.v1.getReferencingModuleIds` and purged by its `module:<id>` too.
- Per-request memoisation uses `React.cache` (tenant row, base URL, page loaders), never the Data Cache.

## Configuration

- No editor or operator settings. Editors trigger purges by publishing; owners trigger them by saving Look, Voice or Features (see [look](./look.md), [voice](./voice.md), [plans-and-entitlements](./plans-and-entitlements.md)).
- The Sanity webhook itself is console configuration on each tenant project.

## Constraints and invariants

- **Tag-scope contract** — a loader's `isr()` tags must cover every `_type` its query can read, including dereferenced ones; tag strings come from `REVALIDATE_TAGS`, never invented.
- `REVALIDATE_TAGS` must have an entry for every `TModuleType` and every cached document type (`type-check` fails otherwise); `pnpm check:revalidate-tags-sync` fails when a tag used in an `isr()` call has no entry.
- The webhook purges each tag in both its unprefixed and `t:<projectId>:` form, with `{ expire: 0 }` (immediate expiry, not stale-while-revalidate).
- Tag expiry does not invalidate prerendered routes, so every purge also calls `revalidatePath`. Only `page_post` has a precise, tenant-scoped path derivation (the post, home, the blog index and every topic and tag page with pagination, in every live language). Every other tagged type, and any failed derivation, falls back to `revalidatePath('/', 'layout')` across all tenants, logged as `revalidate.path_purge_fallback`. A type with no `REVALIDATE_TAGS` entry (such as `settings_voice`) purges no tags and no paths.
- A per-tenant layout purge is not expressible: Next derives layout tags from the bracketed route pattern, so `revalidatePath('/<tenantId>', 'layout')` silently matches nothing.
- A webhook from an archived tenant's project is acknowledged and ignored. A `delete` of a `page_post` also removes that post's bookmarks.
- A renamed slug leaves the old URL's page cached until the route backstop expires it. A scheduled post appears only as caches expire; nothing purges when its date passes.
- `/api/revalidate-site-config` always purges the whole site layout as well as the tenant's tags; with no `tenantId` it purges every tenant's tags.
- `revalidateTag` needs the Node.js runtime; both routes declare `runtime = 'nodejs'`.

## Dependencies

- Layers: `service` (`isr`, loaders), `web` (routes, webhook), `db` (tenant lookup by Sanity project id, config reads), `platform` (calls the config endpoint), `config` (TTL constants).
- Features: [multi-tenancy](./multi-tenancy.md), [posts](./posts.md), [module-system](./module-system.md), [bookmarks](./bookmarks.md), [languages](./languages.md), [seo-and-feeds](./seo-and-feeds.md).
- Env vars: `SANITY_REVALIDATE_SECRET` (web), `SITE_CONFIG_REVALIDATE_SECRET` (web and platform, identical), `WEB_APP_URL` (platform), `SANITY_LIVE_CONTENT` (service, development only). A missing secret makes its route return 500.

## Entry points

- `apps/web/src/app/api/revalidate/route.ts`
- `apps/web/src/app/api/revalidate-site-config/route.ts`
- `apps/web/src/utils/revalidate-tags/revalidate-tags.ts`
- `apps/web/src/server/revalidate/derive-revalidate-paths/derive-revalidate-paths.ts`
- `apps/web/src/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags.ts`
- `packages/service/src/sanity/query/isr.ts`
- `packages/config/src/constants/cache.ts`
- `apps/platform/src/server/site-config/revalidate-site-config.ts`

## Tests and stories

- Web: `app/api/revalidate/route.test.ts`, `app/api/revalidate-site-config/route.test.ts`, `revalidate-tags.test.ts`, `tenant-cache-tags.test.ts`, `derive-revalidate-paths.test.ts`, `resolve-referencing-module-tags.test.ts`, `build-post-publish-paths.test.ts`, `get-site-config.test.ts`, `get-tenant-plan.test.ts`, `get-effective-settings-features.test.ts`; each route's `page.test.tsx` asserts its `revalidate` literal.
- Service: `packages/service/src/sanity/query/isr.test.ts`.
- Scripts: `scripts/check-revalidate-tags-sync.test.mjs`.
- No stories.

## Related

- #2682 — verify the tenant-scoped path purge against a real running site.
- #2440 — measure per-request tenancy cost, then cache the host → tenant lookup.
