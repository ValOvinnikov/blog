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
  ├─ service.pages.<page>   ──thin query──►  { title, hero?, modules[]: TModule, seo }
  └─ service.modules.<type> ──runQuery + groqd, keyed by module id──►  typed module view-model
      ▼
apps/web
  ├─ page.tsx           fetches service.pages.<page>, checks result.ok
  ├─ ModuleRenderer      maps each TModule → MODULE_MAP[type]({ id, locale })
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
