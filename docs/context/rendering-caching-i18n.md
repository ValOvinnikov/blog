# Rendering, caching & i18n

> Part of the docs split described in [`docs/README.md`](../README.md).
> Referenced from `SPEC.md` §9.

- **Default:** static generation; `generateStaticParams` for dynamic routes
  (service exposes `params` slices returning `{ slug }[]`).
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
- **Revalidation:** time-based via `isr('tag')` in service queries; on-demand
  via `app/api/revalidate` (#93, secret-verified,
  `revalidateTag(tag, { expire: 0 })` — immediate expiry, not a stale-while-
  revalidate profile) from a Sanity publish webhook. Tag expiry alone does not
  invalidate prerendered route entries on Vercel (#318), so the route also
  calls `revalidatePath('/', 'layout')` when a registered type matched —
  purging every page per publish (acceptable blast radius for a blog).
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
