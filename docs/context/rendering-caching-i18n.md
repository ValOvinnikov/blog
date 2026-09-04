# Rendering, caching & i18n

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §9.

- **Content routes cache per tenant, filled on demand.** Routes live under
  `app/[tenant]/[locale]/`, take the tenant from `params.tenant`, and their
  `generateStaticParams` return an empty list with `dynamicParams` at its
  default `true` — so nothing is baked at build time and each
  `(tenant, locale, slug)` path is rendered and cached on its first request.
  Tenants are deliberately not enumerated at build: that needs production
  credentials in the build, grows linearly with tenant count, and hits a
  per-page `staticPageGenerationTimeout` cliff rather than degrading
  gracefully.

  Measured on the #2625 stage-3 branch: eleven tenant content routes appear in
  `prerender-manifest.json` under `dynamicRoutes`; `routes` (real build-time
  HTML) stays exactly `/_global-error` and `/robots.txt`; and the only
  remaining `Dynamic server usage … used headers` bailout is `/_not-found`,
  which has no params to read instead. `account` and `bookmarks` are excluded
  from `dynamicRoutes` entirely by `force-dynamic` — both render the signed-in
  reader's own session and must never be cached across users.

  Note the `next build` summary marks these routes `●`, which means only that
  a `generateStaticParams` exists somewhere in the ancestor chain — **not**
  that HTML was emitted. The prerender manifest and `.next/server/app/**/*.html`
  are the authoritative signals; the marker has misled twice during this work.

  History behind the measurement:
  #2440 measured the resulting `next build` output: every content route
  (`/[locale]`, `/[locale]/blog`, `/[locale]/blog/[slug]`,
  `/[locale]/tags/**`, `/[locale]/topics/**`, `/rss.xml`, `/sitemap.xml`,
  `/icon`, `/opengraph-image`, `/twitter-image`) is `ƒ` (Dynamic); only
  `/_not-found` and `/robots.txt` remained static at that baseline. #2477 gave
  the root layout its own `headers()` dependency via
  `getThemeTokens()`/`isCapabilityEnabled()`; #2625's first stage moved both
  down into `[locale]/layout.tsx`, leaving the root layout
  tenant-independent (see "Root layout" below). For the ten content routes
  above neither change altered the rendering mode — a descendant layout or
  page already forced dynamic rendering. `/_not-found` is different: it
  renders outside `[locale]/layout.tsx` and had no `headers()` dependency
  before #2477, so it was one of the two routes #2440 measured as static; it
  now resolves its own theme tokens and so keeps one. A `pnpm --filter web build` on the #2477 branch confirms
  `/_not-found` is now `ƒ` (Dynamic) too — only `/robots.txt` remains `○`
  (Static), and the prerender manifest bakes 2 routes (`/_global-error`,
  `/robots.txt`) instead of #2440's baseline of 3. #2440 remains the open
  question of whether/how to claw any of this back; #2625 answered it by
  putting the tenant in the path, which is what the first bullet above now
  describes.

- **Build-time zero-results guard — removed (#2493, was #889):**
  `blog/[slug]`'s `generateStaticParams` used to throw, failing the build, when
  its params query resolved successfully but to zero posts — a tripwire for a
  build-scoped Sanity token not reaching the build step (e.g. a Vercel
  "Sensitive" env var, redacted during `vercel build` but injected at runtime),
  which would otherwise silently ship a route with zero prebuilt paths. #2493
  deleted it together with the `generateStaticParams` that hosted it: with no
  build-time Sanity query left on any content route there is nothing for it to
  observe, and it asserted against the **platform's** project while every
  tenant's content is read with credentials fetched per request from Neon.
  There is deliberately no replacement — if a missing-token alarm is wanted
  again, the right shape is an explicit env assertion, not one inferred from an
  empty result set.
- **Revalidation:** time-based via `isr('tag', projectId)` in service queries
  (the tenant's project id is required, and scopes the emitted tag); on-demand
  via `app/api/revalidate` (#93, secret-verified,
  `revalidateTag(tag, { expire: 0 })` — immediate expiry, not a stale-while-
  revalidate profile) from a Sanity publish webhook. Tag expiry alone does not
  invalidate prerendered route entries on Vercel (#318), so the route also
  purges paths, on top of the tag purge above. A published `blog_post` purges
  only its own tenant's affected paths; every other type still purges every
  page of every tenant, as described below.

  A per-tenant layout purge is not expressible: `revalidatePath('/<tenantId>',
'layout')` matches nothing. Next derives its per-segment layout tags from
  the **route pattern with brackets unresolved** (`getDerivedTags` in
  `next/dist/server/lib/implicit-tags.js`), so a page under
  `[tenant]/[locale]` carries `_N_T_/[tenant]/layout`, never an interpolated
  id; the resolved pathname contributes one exact tag with no `/layout`
  suffix. A scoped layout purge therefore fails **silently** — no error, no
  log, stale HTML served indefinitely — and a unit test cannot catch it,
  since `revalidatePath` is mocked and only its arguments are observable.
  Passing the bracket pattern instead matches every tenant, so it buys
  nothing.

  Purging **resolved** paths does work — `revalidatePath('/<tenantId>/<locale>/
blog/my-post')` matches the resolved-pathname tag exactly — and is how the
  route now purges a published `blog_post` (#2666):
  `@web/server/revalidate/derive-revalidate-paths` queries `@blog/service` for
  the post's own slug, every archive's current pagination extent
  (`getIndexPageParams`), and **every** tag/topic page of the tenant
  (`getTagParams`/`getTopicParams` for the page-1 slugs, `getTagPaginationParams`/
  `getTopicPaginationParams` for pages 2…N) — not filtered down to the ones
  this post currently belongs to. Then `@web/utils/build-post-publish-paths`
  assembles the full, tenant-and-locale-scoped path set — the post's own page,
  home, the blog archive with pagination, and every tag/topic page (with its
  own pagination) in the tenant. Purging the whole taxonomy rather than just
  the post's current tags/topic is deliberate: a re-categorisation or tag
  removal leaves stale HTML on the page the post was removed from, and the
  derivation would otherwise report success while missing it. This makes
  `getPostTaxonomySlugs` (`@blog/service`) unnecessary for path derivation —
  it's no longer called from `apps/web`, though the function itself stays for
  a possible future consumer.

  **Known limitation, accepted rather than solved:** a renamed post slug is
  not recoverable from the webhook payload, so the page at the _old_ slug
  keeps its stale prerendered HTML (still listing the post) until something
  else revalidates that path. Fixing this would require reconfiguring the
  Sanity webhook to project the document's previous slug, which is
  human-gated console work.

  Every other `_type` (including the `posts`-tagged
  `blog_author`/`blog_topic`/`blog_tag`, whose edit can affect every
  post-list-bearing page of a tenant) has no precise derivation yet — full
  enumeration for those is unbounded in the number of `revalidatePath` calls
  for a large tenant, a design tradeoff not yet resolved. Any undeliverable
  derivation — an unresolved tenant, a `_type` with no derivation, a thrown
  Sanity-credentials lookup, or a failed lookup — falls back to the
  whole-site `revalidatePath('/', 'layout')` purge, always logged
  (`revalidate.path_purge_fallback`) rather than left silently incomplete.
  The credentials lookup (`getTenantSanityCredentials`, which throws when
  `TENANT_TOKEN_ENCRYPTION_KEY` is unconfigured, or on a transient DB error)
  is wrapped in a try/catch for exactly this reason — an uncaught throw there
  would abort the handler before the fallback purge ever ran, which is worse
  than the partial purge the fallback exists to prevent.

  The same route also cleans up orphaned `bookmarks` rows (`@blog/db`) when the
  webhook's `sanity-operation` header reads `delete` for a `blog_post` —
  unpublish fires the same trigger as true deletion, so one check covers
  both. Detection is header-only, never a re-query against Sanity: a
  re-query result can't distinguish "post deleted" from "Sanity temporarily
  unreachable" once it passes through the service layer's `safeAsync`
  wrapper, so a transient failure could otherwise wipe live bookmarks.
  Cleanup is tenant-scoped (resolved from the `sanity-project-id` header,
  skipped rather than guessed if unresolvable) and best-effort — a failure
  is logged but never turns the response into a non-2xx, since Sanity would
  retry the whole revalidation.

- **`site_config` on-demand revalidation:** `POST /api/revalidate-site-config`
  (`apps/web`) mirrors `/api/revalidate`'s cache-purge shape
  (per-tenant `revalidateTag('site-config:<tenantId>', { expire: 0 })` +
  same for `settings-features`/`tenant-plan`) but not its verification
  mechanism or its caller — it's called by `apps/platform`'s Look/Voice save
  actions after a `site_config` write, not by a Sanity webhook, so it
  verifies a plain shared secret (`SITE_CONFIG_REVALIDATE_SECRET`, sent as a
  bearer token) rather than `@sanity/webhook`'s HMAC signature. Accepts an
  optional JSON body `{ tenantId }` to scope the purge to just that tenant;
  an omitted `tenantId` falls back to revalidating every tenant, so
  revalidation never silently stops working; `apps/platform` always sends one,
  leaving that fallback as a safety net for a future caller rather than a path
  the panel takes.

  Unlike `/api/revalidate`, this route makes no attempt at a resolved-path
  derivation and is expected to stay that way permanently (#2666) — a
  Look/Voice/Features save changes theme tokens, nav or feature flags on
  _every_ page the tenant renders, so there is no smaller path set that would
  be correct to purge instead of the whole site; a full per-tenant path
  enumeration would be no more correct here, only more code. It always falls
  back to `revalidatePath('/', 'layout')`, logged
  (`revalidate_site_config.whole_site_purge`, with the resolved `tenantIds`)
  rather than silent.

  It calls the endpoint best-effort
  (`@platform/server/site-config/revalidate-site-config`) — a failed call is
  logged, never thrown, and the site-config cache's own
  3600s (`SITE_CONFIG_REVALIDATE_SECONDS`) window remains the fallback
  either way. `deprovision-tenant.yml`'s `invalidate-tenant-cache`
  step is a second caller, POSTing the same `{ tenantId }` once a tenant has
  been archived, and it takes the opposite stance deliberately — it throws on
  missing config or a non-2xx rather than logging and continuing, because a
  skipped purge would leave an archived site serving from the prerender cache.

- **Skim generation pipeline (#957):** `POST /api/generate-skim?secret=…`
  (`apps/web`), triggered by a Sanity publish webhook on `post`. Verification
  matches `/api/revalidate`'s _stance_ (feature-flag-by-absence, same 401/503
  split), not its mechanism — `/api/revalidate` checks an HMAC signature over
  the body (`@sanity/webhook`); this route does a constant-time
  (`timingSafeEqual`) comparison of a plain shared secret against `?secret=`,
  since there's no equivalent signature helper for a static secret. Absent
  `ANTHROPIC_API_KEY`/`SANITY_GENERATE_SECRET` → 503; a missing/wrong
  `secret` → 401. On success it reads the published post body
  (`service.editorial.skim.v1.getPublishedPostBody`), asks Claude
  (`claude-haiku-4-5`) for 3–7 zod-validated takeaways (a malformed response
  → 422, draft untouched), then patches them onto the post's **draft**
  (`service.editorial.skim.v1.saveSkimDraft` — never the published document).
  Idempotent: re-running always overwrites only the draft's `skim` field. No
  AI call ever happens on the reader path.
- **Sanity CDN is deliberately bypassed** (`useCdn: false` in the service
  client): Next's tagged data cache is the sole caching layer. Reading through
  the CDN lets a just-purged tag refetch a still-stale CDN response and
  re-cache it — do not flip it back on as a perf optimisation (#316).
- **Preview/drafts:** Next.js Draft Mode + Sanity Presentation — planned
  post-deployment (see `docs/BACKLOG.md`), enabled by `SANITY_API_READ_TOKEN`.
- **i18n:** all routes under `src/app/[locale]/`; next-intl middleware with
  `localePrefix: 'never'` (URLs never show the locale). Locales come from
  `LOCALE_ISO_CODES` in `@blog/config` (currently `en`). Never hardcode a
  locale; `setRequestLocale(locale)` at the top of every layout/page. All
  in-app links go through the single `SmartLink`
  (`@web/components/shared/smart-link`), which is itself locale-aware — it
  renders next-intl's `Link` internally, falling back to `next/link` only for
  protocol-relative (`//host`) hrefs, and applies `rel="noopener noreferrer"`
  on `target="_blank"`. Never use `next/link` or the i18n `Link` directly at a
  call site. `@web/i18n/navigation` remains the source of the non-link
  navigation helpers (`permanentRedirect`, `usePathname`) and of the `Link`
  that `SmartLink` wraps internally.
- **Root layout:** `src/app/layout.tsx` is a real root layout — it owns the
  document shell (`<html>`/`<head>`/`<body>`, global stylesheet, the
  Sanity CDN preconnect, the dark-mode bootstrap script) with a fixed `lang`
  (`LOCALE_ISO_CODES.EN`; this app has exactly one locale today). It is
  **tenant-independent and reads no Dynamic API**: theme tokens, `next/font`
  variables, analytics gating and the tenant's voice overrides all live in
  `[locale]/layout.tsx`, which also owns everything locale-aware
  (`NextIntlClientProvider`, `Header`/`Footer` chrome, the locale-validation
  `notFound()`). The theme tokens reach the tree through `ThemeScope`
  (`src/components/shared/theme-scope/`), whose `<style>` carries
  `precedence`/`href` so React hoists it into `<head>` from wherever it
  mounts — there is no ordering constraint on its siblings.
  `src/i18n/request.ts` is tenant-independent for the same reason, returning
  base locale messages only, with `resolveTenantMessages` applying the
  tenant's preset voice pack and overrides in the layout instead. Both
  moved in #2625's first stage, because the root layout and
  `getRequestConfig` sit above any future `[tenant]` segment and can never
  receive it as a param. The root layout exists so root-level files
  that need a layout to render into — chiefly `src/app/not-found.tsx` for
  genuinely unmatched URLs — have one; `not-found.tsx` renders outside the
  `[locale]` tree, so it has no `Header`/`Footer` chrome, just the terminal-
  styled 404 body (#491), and it mounts its own `ThemeScope` and resolves its
  own messages rather than inheriting either.
