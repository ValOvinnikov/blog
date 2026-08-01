# Data flow & typegen

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §5.

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
  custom-vs-fallback fields (see [`content-model.md`](./content-model.md)).
- **Service also has a scoped write path, `service.editorial.*`** (e.g.
  `service.editorial.skim.v1`, added for the choose-your-depth reading
  pipeline, #957) — separate from the read-only flow described above.
  `packages/service/src/sanity/write-client.ts` is a distinct client from the
  page-render read client, authenticated with `SANITY_API_WRITE_TOKEN`
  (server-only, never bundled to the client). Writes are always scoped to a
  document's **draft** (`drafts.<id>`), never the published document, and are
  triggered by an explicit pipeline action — concretely, `apps/web`'s
  `POST /api/generate-skim` route (webhook-driven, secret-verified — see
  [`rendering-caching-i18n.md`](./rendering-caching-i18n.md)) — never by a page
  render. A human still reviews and publishes the draft in Studio before it
  goes live — the write path only stages content, it never publishes.
- **Web renders modules generically.** `apps/web/src/modules/module-map.ts`
  registers `MODULE_MAP: Record<Exclude<TModuleType, 'module_hero'>, (props) =>
ReactNode>` — typed exhaustively over every module type in
  `TModuleType`/`MODULE_TYPE` (`@blog/config`) **except** `module_hero`, so
  omitting any other module type from the map is a compile error.
  `module_hero` is deliberately excluded: the CMS schema never allows a
  `module_hero` entry inside any page's `modules[]` array (`page_generic`
  allows only `content`/`cta`; `page_home` allows only `postList`/`cta`), so
  it can never reach `ModuleRenderer` — see the home-route note below.
  `module-renderer.tsx`'s `ModuleRenderer` walks a page's
  `modules: TModuleRef[]`, resolves each entry through `MODULE_MAP` (cast to
  `keyof typeof MODULE_MAP`, since the raw `TModuleType` still includes
  `module_hero`), and renders the result keyed by the module's stable `_key`;
  an unrecognized type — including a `module_hero` if the schema constraint
  were ever loosened — renders nothing and logs a warning rather than failing
  the page. Each per-module component
  (`apps/web/src/modules/<type>/<type>-module.tsx`) is an async Server
  Component that calls its `service.modules.<type>` fetcher, checks
  `result.ok`, and maps the view-model onto the matching pure `@blog/ui`
  organism — this is the only place that module's service and ui meet. The
  home route instead renders `HeroModule` directly, as a dedicated `hero` prop
  on `HomePageTemplate`, for `page_home`'s required `hero` reference (kept
  separate from `modules[]` and from `MODULE_MAP`/`ModuleRenderer` entirely).
