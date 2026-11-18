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
  - apps/web/src/utils/build-tenant-site-paths/**
  - apps/web/src/utils/build-next-page-paths/**
  - apps/web/src/server/tenant/tenant-live-locales/**
  - apps/web/src/server/tenant/tenant-page-lists/**
  - apps/web/src/server/site-config/get-site-config/**
  - apps/web/src/server/settings-features/get-tenant-entitlements/**
  - apps/web/src/server/tenant/tenant-entitlements/**
  - apps/web/src/server/settings-features/get-effective-settings-features/**
  - apps/platform/src/server/site-config/revalidate-site-config.ts
  - apps/web/src/server/draft-preview/**
  - packages/utils/src/preview-token/**
  - apps/web/src/app/[tenant]/[locale]/~preview/**
  - scripts/check-revalidate-tags-sync.mjs
epics: []
---

# Rendering and caching

## What it does

Public pages are rendered on their first request per tenant, language and path, then served from Next's Full Route Cache. Sanity reads and tenant-config reads sit in the Data Cache under tags. Publishing in the Studio fires a signed webhook that expires the affected tags and paths immediately; a Look, Voice or Features save in the platform calls a second endpoint that does the same for that tenant's config. Time-based expiry bounds how long a missed purge can stay visible.

A member can see an unpublished draft on the tenant's real site through a signed preview token in the address. That one request renders uncached through Sanity's `drafts` perspective; no cookie is set and Next's Draft Mode is never used.

## Surfaces and routes

- `POST /api/revalidate` — Sanity publish/unpublish/delete webhook (signature-verified).
- `POST /api/revalidate-site-config` — called by `apps/platform` after a Look save or brand-image upload or clear, a Voice, Features, tenant-details or languages save, a Stripe price-catalogue write, a plan change from the Stripe webhook, and a connected custom domain's removal, and by `apps/worker` as deprovisioning's closing step, `INVALIDATE_TENANT_CACHE`, after the tenant is archived (Bearer secret, optional `{ tenantId }` body). Until that step runs, a deprovisioned tenant's removed hosts still resolve to it through the cached host lookup.
- Every content route under `apps/web/src/app/[tenant]/[locale]/` declares `export const revalidate = 86400`, and every route with a dynamic segment (`[...slug]`, `blog/[slug]`, `blog/page/[page]`, and the topic and tag slug and pagination routes) declares an empty `generateStaticParams`, so none of them is prerendered at build and each path is cached on first request. The `[tenant]/[locale]` layout's `generateStaticParams` returns the default locale only.
- `account` and `bookmarks` are `force-dynamic` and never cached across readers.
- `[tenant]/[locale]/~preview/blog/[slug]` and `[tenant]/[locale]/~preview/[...slug]` — the draft render of a post and a landing page, `force-dynamic`. Reached only by the proxy's rewrite of a request carrying a verified `?preview=<token>`; the `[tenant]` segment is then `<tenantId>~preview`.

## Data

- **Sanity Data Cache** — every `@shinefold/service` loader but the two below passes `isr(tags, projectId)`, which emits `revalidate: 86400` (`SANITY_CONTENT_REVALIDATE_SECONDS`) and tags prefixed `t:<projectId>:<tag>`. With `SANITY_LIVE_CONTENT=1` in development it returns `cache: 'no-store'`. Those two are never cached, because the revalidate webhook acts on their answer: the publish-date read (`getPostPublishedAt`, `cache: 'no-store'`) and the referencing-module lookup (`getReferencingModuleIds`, `revalidate: 0`). The Sanity client runs with `useCdn: false`.
- **Tenant config Data Cache** — `getSiteConfig`, `getTenantEntitlements`, `getEffectiveSettingsFeatures`, `resolveTenant` and `getPlanPrices` wrap their `@shinefold/db` reads in `unstable_cache`, tagged `site-config:<tenantId>`, `tenant-plan:<tenantId>`, `settings-features:<tenantId>`, `tenant-by-host` and `stripe-catalogue`, `revalidate: 86400` (`TENANT_CONFIG_REVALIDATE_SECONDS`). The one exception is the proxy's read of a tenant's entitlement grants, which has its own entry tagged `site-config:<tenantId>` with a one-hour revalidate.
- **Full Route Cache** — `CONTENT_ROUTE_REVALIDATE_SECONDS` (86400) is the backstop; each route hardcodes the literal. A page caches only as long as the shortest window among its route and every Data Cache read it makes, so the three windows are held equal at 24 hours.
- **`REVALIDATE_TAGS`** (`apps/web/src/utils/revalidate-tags`) maps a document `_type` to the tags its publish purges. Module types also purge `module:<id>`; any module whose markup embeds the published document is found through `service.entities.modules.v1.getReferencingModuleIds` and purged by its `module:<id>` too.
- Per-request memoisation uses `React.cache` (tenant row, base URL, page loaders), never the Data Cache.

## Configuration

- No editor or operator settings. Editors trigger purges by publishing; owners trigger them by saving Look, Voice or Features (see [look](./look.md), [voice](./voice.md), [plans-and-entitlements](./plans-and-entitlements.md)).
- Provisioning creates each tenant project's Sanity webhook (`createSanityWebhook` in `@shinefold/db`). Its projection sends `_type`, `_id`, `slug` and `previousSlug` — the slug before the change, from `before()`, `null` on a create — so a renamed page's old address is known. `listSanityWebhooks` exposes each hook's projection and `updateSanityWebhookProjection` replaces it by sending the whole rule (`on` and `projection`), so a `filter` set on the hook is dropped — provisioned hooks set none — and the hook's secret is untouched.

## Constraints and invariants

- **Tag-scope contract** — a loader's `isr()` tags must cover every `_type` its query can read, including dereferenced ones; tag strings come from `REVALIDATE_TAGS`, never invented.
- Every loader that reads a `link` document — directly, through a Portable Text link mark (the contact form's privacy note) or through a post card's author `profilePage` (post-latest, post-list, post-featured, related posts, posts by id and the hero's post fallback) — spreads `LINK_TARGET_CACHE_TAGS` (`packages/service/src/shared/cache-tags/link/`) — `link` plus every page type a link can reference — into its `isr()` tags, so a new linkable page type adds its tag there once.
- `REVALIDATE_TAGS` must have an entry for every `TModuleType` and every cached document type (`type-check` fails otherwise); `pnpm check:revalidate-tags-sync` fails when a tag used in an `isr()` call, directly or through a spread shared tag list, has no entry.
- The webhook purges each tag in both its unprefixed and `t:<projectId>:` form, with `{ expire: 0 }` (immediate expiry, not stale-while-revalidate).
- Tag expiry does not invalidate prerendered routes, so every purge also calls `revalidatePath` on resolved, tenant-scoped paths (`/<tenantId>/<locale>/…`). A live `page_post` purges its own set: the post, home, the blog index and every topic and tag page with pagination, in every live language. Every other tagged type — and a post the lookup no longer finds (deleted, unpublished or future-dated) — purges every page that tenant renders: the pages the sitemap lists (posts, topics, tags and their pagination, landing pages, privacy and legal documents) in their own language; home, the blog index and its pagination, the topic, tag, privacy and legal indexes, the cookie statement and the newsletter result and unsubscribe pages in every live language; the page after the last of the blog index and of each topic and tag, which a removed entry can leave cached; and the changed document's own path, from the webhook's projected `slug` (`null` for a document without one). A `delete` (which includes an unpublish) of any type but a post, a `redirect` and a `module_postList` change skip the derivation, because no list holds their stale paths — a landing page's projected slug is its last segment only, a redirect's old path is unknown and a page-size change can drop many pages — and fall back with reason `path_underivable`. A large tenant costs about one `revalidatePath` per listed page and pagination page, plus one next page per topic and tag and about sixteen per live language. Otherwise only an unresolved tenant, missing tenant credentials or a failed lookup falls back to `revalidatePath('/', 'layout')` across all tenants, logged as `revalidate.path_purge_fallback` with the reason; a failed live-locales or page-list lookup also logs `revalidate.live_locales_lookup_failed` or `revalidate.tenant_page_list_lookup_failed`. A type with no `REVALIDATE_TAGS` entry (such as `settings_voice`) purges no tags and no paths.
- A per-tenant layout purge is not expressible: Next derives layout tags from the bracketed route pattern, so `revalidatePath('/<tenantId>', 'layout')` silently matches nothing.
- A webhook from an archived tenant's project is acknowledged and ignored. A `delete` of a `page_post` also removes that post's bookmarks. Any other `page_post` event, including a scheduled post, stamps the tenant's `first_post_published_at` once, while it is empty; a starter post (an `_id` beginning `starter.`) never does. A `create` of a `page_post` — a first publish — may also start the post's newsletter send ([newsletter](./newsletter.md#sending-a-post)); whatever that step does, the response is unchanged.
- A `create` or `update` of a `page_post` whose `publishedAt` is still ahead schedules its purge: web reads the date uncached (`service.entities.posts.v1.getPostPublishedAt`) and enqueues a worker run with `POST <WORKER_ENQUEUE_URL>/api/scheduled-post-purge`, body `{ tenantId, postId, publishedAt }`, signed under `WORKER_NEWSLETTER_ENQUEUE_SECRET`. Every such publish enqueues; the worker drops a run whose date no longer matches the post, and a duplicate for the same date. A date already passed enqueues nothing — that publish is purged like any other. A failed read or enqueue is logged (`revalidate.scheduled_post_lookup_failed`, `revalidate.scheduled_purge_enqueue_skipped`, `_refused`, `_failed`) and never changes the webhook's response. When the date arrives the worker calls `POST /api/revalidate/scheduled-post` with `{ tenantId, postId }`, signed with the enqueue signature under `SANITY_REVALIDATE_SECRET` and that path; the route resolves the post inside the signed tenant only and runs the same tags-and-paths purge as a publish, so the post reaches its own URL, home, the blog index and every topic and tag page in every live language. An unsigned call answers 401, a malformed body 400 and an unknown tenant 404 — final for the worker — while a failed tenant lookup answers 500 (`revalidate.scheduled_purge_tenant_lookup_failed`), which it retries.
- A `create` of a non-starter `page_post` from a tenant project also starts the post's AI takeaways in `after()`, once the response is sent ([skim pipeline](./skim-pipeline.md#triggers)): generated now when its `publishedAt` has passed, or handed to a worker run that generates at go-live when it is ahead. An `update` and a `delete` start nothing; a failure is logged as `generate_skim.*` and never changes the response.
- A renamed post, topic, tag, privacy or legal document — a body whose `previousSlug` is set and differs from `slug` — also purges its old address in every live language of the publishing tenant, and a renamed topic or tag the old address's pagination: each page the topic or tag now has under its new slug, plus the page after the last. An unchanged slug, or a body with no or a `null` `previousSlug` (a project still on the old projection), adds nothing. A renamed landing page is not covered here — its address is a parent chain the body does not carry — but its path change writes a `redirect`, whose publish runs the whole-site purge.
- `/api/revalidate-site-config` purges the tenant's tags, `tenant-by-host` and `stripe-catalogue` (the price catalogue linked pricing tiers read, [pricing-module](./pricing-module.md)), and the same every-page path set for that tenant. An archived tenant — deprovisioning's closing call reaches it after its credentials are cleared — purges its tags and `tenant-by-host` but no path and logs nothing, since the proxy already answers its every page 404; a live tenant whose credentials are missing still falls back. With no `tenantId` it purges every tenant's tags and falls back to the whole-site layout purge, as does a failed tenant, credentials or page-list lookup, each logged as `revalidate.path_purge_fallback`.
- `revalidateTag` needs the Node.js runtime; both routes declare `runtime = 'nodejs'`.
- **Draft preview never touches a shared cache.** A preview token is `<base64url claims>.<HMAC-SHA256>` under `PREVIEW_LINK_SECRET`, with claims `{ tenantId, path, expiresAt }` (epoch ms), signed and read by `@shinefold/utils/preview-token`; a token whose expiry lies more than `PREVIEW_TOKEN_MAX_AGE_MS` (one hour) plus a minute's clock skew ahead is refused. `proxy.ts` accepts it only when the tenant matches the host's and the path matches the request's, then rewrites to the `~preview` route and passes the token to the render in `x-preview-token` (stripped from every incoming request). Any other token is ignored and the published page is served. Every path carrying the `~preview` marker (or `%7Epreview`) runs through the proxy and is answered 404, so no outside request addresses a draft route, and a marked `[tenant]` segment on any route but the draft routes and their shared layout is a 404 without reading a header. The render re-verifies the token's tenant before it reads anything; it reads the tenant's own credentials with the `drafts` perspective, which `runQuery` sends `cache: 'no-store'`, and never the platform fallback. The published routes read no cookie and no header, so they stay cached as before.
- **Framing.** `next.config` leaves `Content-Security-Policy`, `Referrer-Policy` and `X-Frame-Options` to the proxy on any request carrying `?preview`, and the proxy matcher routes every such request through the proxy. A verified preview gets `frame-ancestors <PLATFORM_APP_URL origin>`, `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex`; an unverified one gets `frame-ancestors 'none'` and `X-Frame-Options: DENY`. Every response without the parameter keeps the site-wide headers.
- **Why not Draft Mode.** Next's Draft Mode cookie value is the deployment's `previewModeId`, the same value that, sent as `x-prerender-revalidate`, triggers an on-demand rebuild (`next/dist/server/api-utils/index.js`, Next 16.4). One cookie would unlock every tenant's drafts and every tenant's cache.
- Only posts and landing pages have a draft route; a token for any other path renders a 404 inside the frame.
- **The path a token signs.** `POST /api/internal/pages/{documentId}/path`, signed under `INTERNAL_PAGES_SECRET` like the title route, takes `{ tenantId }` and answers `{ path }` for a post or landing page read through the `drafts` perspective, uncached, so a never-published draft resolves and a renamed slug answers its draft path. The path is what the proxy compares against `request.nextUrl.pathname`: each segment percent-encoded, the locale prefix as the site serves it (none for the tenant's default language), no trailing slash, no query. Any other page type, an unknown id or a landing page whose parent chain is broken answers 404. A draft in a language the tenant has not switched on answers 409: the proxy would redirect its prefixed path to an unprefixed one the token no longer matches, so the platform explains that the language must be switched on before it can be previewed. The id may be the published id or its `drafts.` form. The caller puts the returned path into the frame's URL exactly as returned, never re-encoded or decoded: it percent-encodes the reserved characters (`: @ , + = & ; $`) a browser would leave raw, and the token's path must match the request's byte for byte.

## Dependencies

- Layers: `service` (`isr`, loaders), `web` (routes, webhook), `db` (tenant lookup by Sanity project id, config reads), `platform` (calls the config endpoint), `config` (TTL constants).
- Features: [multi-tenancy](./multi-tenancy.md), [posts](./posts.md), [module-system](./module-system.md), [bookmarks](./bookmarks.md), [languages](./languages.md), [seo-and-feeds](./seo-and-feeds.md).
- Env vars: `PREVIEW_LINK_SECRET` (web; absent, every preview token is ignored), `PLATFORM_APP_URL` (web; absent, a preview cannot be framed), `SANITY_REVALIDATE_SECRET` (web), `SITE_CONFIG_REVALIDATE_SECRET` (web and platform, identical), `WEB_APP_URL` (platform), `SANITY_LIVE_CONTENT` (service, development only). A missing secret makes its route return 500.

## Entry points

- `apps/web/src/app/api/revalidate/route.ts`
- `apps/web/src/app/api/revalidate-site-config/route.ts`
- `apps/web/src/utils/revalidate-tags/revalidate-tags.ts`
- `apps/web/src/server/revalidate/derive-revalidate-paths/derive-revalidate-paths.ts`
- `apps/web/src/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths.ts`
- `apps/web/src/server/revalidate/resolve-tenant-site-paths/resolve-tenant-site-paths.ts`
- `apps/web/src/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags.ts`
- `packages/service/src/sanity/query/isr.ts`
- `packages/config/src/constants/cache.ts`
- `packages/utils/src/preview-token/preview-token.ts`
- `apps/web/src/app/api/internal/pages/[id]/path/route.ts`
- `apps/platform/src/server/site-config/revalidate-site-config.ts`

## Tests and stories

- Web: `app/api/revalidate/route.test.ts`, `app/api/revalidate-site-config/route.test.ts`, `revalidate-tags.test.ts`, `tenant-cache-tags.test.ts`, `derive-revalidate-paths.test.ts`, `derive-post-publish-paths.test.ts`, `derive-tenant-site-paths.test.ts`, `build-tenant-site-paths.test.ts`, `build-next-page-paths.test.ts`, `tenant-live-locales.test.ts`, `resolve-tenant-site-paths.test.ts`, `resolve-referencing-module-tags.test.ts`, `build-post-publish-paths.test.ts`, `get-site-config.test.ts`, `get-tenant-entitlements.test.ts`, `tenant-entitlements.test.ts`, `get-effective-settings-features.test.ts`, `has-draft-preview-token.test.ts`, `enter-draft-preview.test.ts`, and the draft preview cases in `proxy.test.ts` and `request-context.test.ts`; each route's `page.test.tsx` asserts its `revalidate` literal.
- Service: `packages/service/src/sanity/query/isr.test.ts`.
- Utils: `packages/utils/src/preview-token/preview-token.test.ts`.
- Scripts: `scripts/check-revalidate-tags-sync.test.mjs`.
- No stories.

## Related

- #2682 — verify the tenant-scoped path purge against a real running site.
- #2440 — measure per-request tenancy cost, then cache the host → tenant lookup.
