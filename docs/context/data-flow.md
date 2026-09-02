# Data flow & typegen

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §5.

```
Sanity Studio (packages/studio)
      │  pnpm typegen  (sanity schema extract → schema.json,
      │                 sanity typegen generate → types.ts)
      ▼
packages/config/src/sanity/generated/{schema.json,types.ts}   (committed)
      ▼
@blog/service
  ├─ service.pages.<page>   ──thin query──►  { title, hero?, modules[]: TModule, seo }
  └─ service.modules.<type> ──runQuery + groqd, keyed by module id──►  typed module view-model
      ▼
apps/web
  ├─ page.tsx           fetches service.pages.<page>, checks result.ok
  ├─ ModuleRenderer      maps each TModule → MODULE_MAP[type]({ id, locale })
  └─ per-module component  fetches service.modules.<type>, maps view-model ──plain typed props──►  @blog/ui organism
```

- Typegen config lives in `packages/studio/sanity.cli.ts`; the script is
  `pnpm --filter @blog/studio typegen`. **Commit the generated files.**
- Typegen output can be non-deterministic across runs — if the diff churns,
  re-run until minimal before committing.
- **Typegen is tenant-agnostic** — one schema (`packages/studio`), one
  generated `types.ts`, shared by every tenant. What's tenant-scoped is which
  Sanity _project/dataset_ a request's `service.*` calls actually hit, per the
  read and write paths below.
- **The read path is tenant-aware.** Every `service.*.v1.*` loader accepts an
  optional `tenant?: TTenantSanityContext` argument
  (`packages/service/src/sanity/client.ts`); `getClient(tenant)` builds — and
  LRU-caches, keyed by `projectId:dataset` — a Sanity client scoped to that
  tenant's own project, dataset, and read token, falling back to the legacy
  env-configured client (`SANITY_API_READ_TOKEN`) when `tenant` is omitted.
  `apps/web` resolves the current request's tenant once per render:
  `getTenantSanityContext()` (`apps/web/src/server/tenant/`, wrapped in
  React's `cache()`) reads the tenant id `apps/web/src/proxy.ts` already
  resolved from the request's `Host` header and threaded via the
  `x-tenant-id` header, decrypts that tenant's read credentials fresh from
  `@blog/db` on every request (never cached across requests), and the result
  is passed into each page's and module's loader call — so a single request
  only ever touches one tenant's content. Outside production, or before a
  tenant has credentials provisioned, this resolves to `undefined` and
  loaders fall back to the legacy single-tenant client. A parallel
  `getHostTenantSanityContext()` resolves the same way but reads the `Host`
  header directly, for the handful of routes `proxy.ts`'s matcher excludes
  (`/api/*`, `sitemap.xml`, `rss.xml`, the favicon, the default OG/Twitter
  images) and which therefore never receive `x-tenant-id` in the first
  place — used by `/api/generate-skim`'s own read step, below.
- Generated types mark **every** field optional (validation is runtime-only).
  The service layer restores the contract at the query boundary: explicit
  `sub.field()` projections, `.notNull()` (always last in the chain) for
  schema-required fields, `T | undefined` (never `| null`) in view-models —
  spelled `TMaybeUndefined<T>` (the `@blog/config` alias) for a value that may
  be absent, distinct from property optionality (`field?:`) — and **no faked
  defaults**: absence handling belongs to `apps/web`.
- Service loaders return `Promise<TViewModel>` and throw on missing data, so
  `safeAsync` in each feature's `application/service.ts` converts throws into
  `AsyncResult<T>` (`{ ok: false, error }`). **Page-document loaders are the
  exception**: a document looked up by a user-supplied slug (or a singleton
  that may not be authored yet) treats absence as an ordinary outcome, so its
  outer query is `.nullable(true)` and it returns
  `Promise<TMaybeUndefined<TViewModel>>` instead of throwing. A page that
  exists but has a required module slot unset still throws — that is a real
  data-integrity failure, not an absence.
- The contract `apps/web` sees is therefore three-way: `ok: true` with data
  (render), `ok: true` with `undefined` data (ordinary 404 — **no log**, per
  [`SPEC.md` §17](../../SPEC.md)), `ok: false` (genuine failure — log at
  `error`, then 404). Web owns the failure decision (`notFound()`, fallback,
  or early return).
- **Check the data, not just `ok`.** For a nullable loader, `result.ok` alone
  no longer means "the document exists", and `type-check` cannot catch a
  consumer that still assumes it does — `.ok` stays a valid boolean access
  either way. Gate on `result.ok && result.data`.
- **Page queries are thin.** `page_home`/`page_generic` project only page
  fields plus lightweight module descriptors (`TModule = { id, type }`, from
  `to-module.ts`) — no module internals, no `conditionalByType`. Each
  module type owns its own fetcher (`service.modules.<type>.v1.get<Type>(id)`)
  under `packages/service/src/features/modules/<type>/`, with its own GROQ,
  transformer, and `T | undefined` view-model (`THeroModule`,
  `TPostListModule`, `TContentModule`, `TCtaModule`). `module_postList` fetches
  its own posts (the newest `limit`); `module_hero` resolves its own
  custom-vs-fallback fields (see [`content-model.md`](./content-model.md)).
- **Service also has a scoped write path, `service.editorial.*`** (e.g.
  `service.editorial.skim.v1`, added for the choose-your-depth reading
  pipeline, #957) — separate from the read-only flow described above.
  `packages/service/src/sanity/write-client.ts`'s `getWriteClient()` is a
  distinct client from the page-render read client, and is itself
  tenant-aware the same way `getClient()` is: called with no argument it
  falls back to `SANITY_API_WRITE_TOKEN` (server-only, never bundled to the
  client) — the platform's own content. Called with a tenant's
  `TTenantSanityContext` it authenticates with that tenant's own persisted,
  encrypted write token instead, scoping the write to that tenant's own
  project/dataset. It is **not** true unconditionally that the write client
  authenticates with `SANITY_API_WRITE_TOKEN`. `apps/web`'s
  `POST /api/generate-skim` route, the only caller, resolves this tenant
  context straight from the request's `Host` header via
  `getHostTenantSanityWriteContext()`
  (`apps/web/src/server/tenant/get-host-tenant-sanity-write-context.ts`, the
  write-side counterpart to `getHostTenantSanityContext()` above, not to
  `getTenantSanityContext()` — `/api/*` is one of the routes `proxy.ts`'s
  matcher excludes, so `x-tenant-id` is never set here) rather than through
  the header-threading page renders use. Unlike the read side, the write
  route distinguishes "no tenant resolved at all" (dev/local only — a
  production request with no matching host never reaches this far) from "a
  tenant resolved but has no usable write credentials": only the former
  falls back to the platform token above; the latter fails the request with
  a `503` instead of ever writing to the platform's own project. The
  tenant's two durable Sanity credentials (a `viewer`-scoped read token
  and this `editor`-scoped write token) — how they're minted, persisted
  encrypted, and read back — are documented once, in `SPEC.md`'s two-token
  credential footnote under the `@blog/db` layer contract; this doc doesn't
  duplicate that. Writes are always scoped to a document's **draft**
  (`drafts.<id>`), never the published document, and are triggered by an
  explicit pipeline action — concretely, that same route (webhook-driven,
  secret-verified — see
  [`rendering-caching-i18n.md`](./rendering-caching-i18n.md)) — never by a page
  render. A human still reviews and publishes the draft in Studio before it
  goes live — the write path only stages content, it never publishes.
- **Web renders modules generically.** `apps/web/src/modules/module-map.ts`
  registers `MODULE_MAP: Record<Exclude<TModuleType, 'module_hero' |
'module_postList' | 'module_taxonomyList'>, (props) => ReactNode>` — typed
  exhaustively over `TModuleType` (`@blog/config`) minus those three, so
  omitting any other module type from the map is a compile error. The three
  are excluded because each is reached through a **dedicated slot** rather
  than a page's `modules[]` array, so none can ever reach `ModuleRenderer`:
  `module_hero` via the home template's `hero` prop, `module_postList` via
  `page_blog`'s `postList` reference, and `module_taxonomyList` by the same
  rule once the taxonomy index pages that hold it exist.

  Exclusion from `MODULE_MAP` does **not** exempt a module from
  `REVALIDATE_TAGS` (`apps/web/src/utils/revalidate-tags/revalidate-tags.ts`),
  which is typed `Record<TModuleType, readonly string[]> &
Partial<Record<TSanityType, …>>` — every module type needs a purge-tag entry,
  with no escape hatch. A module type registered without one fails
  `type-check`.
  `module-renderer.tsx`'s `ModuleRenderer` walks a page's
  `modules: TModule[]`, resolves each entry through `MODULE_MAP` (cast to
  `keyof typeof MODULE_MAP`, since the raw `TModuleType` still includes the
  three excluded types), and renders the result keyed by the module's `id`;
  an unrecognized type — including one of those three, if a schema constraint
  were ever loosened — renders nothing and logs a warning rather than failing
  the page. Each per-module component
  (`apps/web/src/modules/<type>/<type>-module.tsx`) is an async Server
  Component that calls its `service.modules.<type>` fetcher, checks
  `result.ok`, and maps the view-model onto the matching pure `@blog/ui`
  organism — this is the only place that module's service and ui meet. The
  home route instead renders `HeroModule` directly, as a dedicated `hero` prop
  on `HomePageTemplate`, for `page_home`'s required `hero` reference (kept
  separate from `modules[]` and from `MODULE_MAP`/`ModuleRenderer` entirely).
