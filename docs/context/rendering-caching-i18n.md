# Rendering, caching & i18n

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §9.

- **Default:** static generation; `generateStaticParams` for dynamic routes
  (service exposes `params` slices returning `{ slug }[]`). In practice this
  no longer holds for content routes since #2408 (every `service` loader
  reads the per-request tenant via `getRequestTenantId()` → `headers()`) —
  #2440 measured the resulting `next build` output: every content route
  (`/[locale]`, `/[locale]/blog`, `/[locale]/blog/[slug]`,
  `/[locale]/tags/**`, `/[locale]/topics/**`, `/rss.xml`, `/sitemap.xml`,
  `/icon`, `/opengraph-image`, `/twitter-image`) is `ƒ` (Dynamic); only
  `/_not-found` and `/robots.txt` remained static at that baseline. #2477's
  root layout (`getThemeTokens()`/`isCapabilityEnabled()`, both now
  tenant-scoped) reads `headers()` too. For the ten content routes above this
  adds no new cost — a descendant layout or page already forced dynamic
  rendering. `/_not-found` is different: it renders outside
  `[locale]/layout.tsx` (see "Root layout" below) and had no `headers()`
  dependency before #2477, so it was one of the two routes #2440 measured as
  static. A `pnpm --filter web build` on the #2477 branch confirms
  `/_not-found` is now `ƒ` (Dynamic) too — only `/robots.txt` remains `○`
  (Static), and the prerender manifest bakes 2 routes (`/_global-error`,
  `/robots.txt`) instead of #2440's baseline of 3. #2440 is the open,
  unresolved question of whether/how to claw any of this back (e.g. Cache
  Components/PPR); it also notes `generateStaticParams` is now vestigial on
  the ten content routes (still runs at build, output never baked).
- **Build-time zero-results guard (`SKIP_ENV_VALIDATION`, #889):**
  `blog/[slug]`'s `generateStaticParams` throws — failing the build — if its
  params query resolves successfully but to zero posts, unless
  `SKIP_ENV_VALIDATION` is set. A real build with valid Sanity access
  resolving to zero posts is not a legitimate "no content yet" state for this
  app (posts exist in production); it previously meant a build-scoped Sanity
  token wasn't actually reaching the build step (e.g. a Vercel "Sensitive"
  env var, redacted during `vercel build` but injected at runtime), silently
  shipping a route with zero prebuilt paths. `SKIP_ENV_VALIDATION` is the same
  flag CI's credential-less builds already set (see
  [`environment-variables.md`](./environment-variables.md)) — it doubles
  as the intentional escape hatch for a build that genuinely has no Sanity
  access.
- **Revalidation:** time-based via `isr('tag', projectId)` in service queries
  (the tenant's project id is required, and scopes the emitted tag); on-demand
  via `app/api/revalidate` (#93, secret-verified,
  `revalidateTag(tag, { expire: 0 })` — immediate expiry, not a stale-while-
  revalidate profile) from a Sanity publish webhook. Tag expiry alone does not
  invalidate prerendered route entries on Vercel (#318), so the route also
  calls `revalidatePath('/', 'layout')` when a registered type matched —
  purging every page per publish (acceptable blast radius for a blog). The
  same route also cleans up orphaned `bookmarks` rows (`@blog/db`) when the
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
  same for `settings-features`/`tenant-plan` +
  `revalidatePath('/', 'layout')` fallback) but not its verification
  mechanism or its caller — it's called by `apps/platform`'s Look/Voice save
  actions after a `site_config` write, not by a Sanity webhook, so it
  verifies a plain shared secret (`SITE_CONFIG_REVALIDATE_SECRET`, sent as a
  bearer token) rather than `@sanity/webhook`'s HMAC signature. Accepts an
  optional JSON body `{ tenantId }` to scope the purge to just that tenant;
  an omitted `tenantId` falls back to revalidating every tenant, so
  revalidation never silently stops working; `apps/platform` always sends one,
  leaving that fallback as a safety net for a future caller rather than a path
  the panel takes. It calls the endpoint best-effort
  (`@platform/server/site-config/revalidate-site-config`) — a failed call is
  logged, never thrown, and the site-config cache's own
  3600s (`SITE_CONFIG_REVALIDATE_SECONDS`) window remains the fallback
  either way.
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
  document shell (`<html>`/`<head>`/`<body>`, global stylesheet, fonts, the
  dark-mode bootstrap script) with a fixed `lang` (`LOCALE_ISO_CODES.EN`; this
  app has exactly one locale today). `[locale]/layout.tsx` nests inside it and
  owns everything locale-aware (`NextIntlClientProvider`, `Header`/`Footer`
  chrome, the locale-validation `notFound()`). This exists so root-level files
  that need a layout to render into — chiefly `src/app/not-found.tsx` for
  genuinely unmatched URLs — have one; `not-found.tsx` renders outside the
  `[locale]` tree, so it has no `Header`/`Footer` chrome, just the terminal-
  styled 404 body (#491).
