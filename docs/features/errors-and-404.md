---
title: Errors and 404
status: built
layers: [web, platform, config]
code:
  - apps/web/src/app/global-error.tsx
  - apps/web/src/app/global-not-found.tsx
  - apps/web/src/app/[tenant]/not-found.tsx
  - apps/web/src/app/[tenant]/[locale]/not-found.tsx
  - apps/web/src/app/[tenant]/[locale]/error.tsx
  - apps/web/src/components/pages/global-error-page/**
  - apps/web/src/components/pages/locale-error-page/**
  - apps/web/src/components/pages/not-found-page/**
  - apps/web/src/components/pages/locale-not-found-page/**
  - apps/web/src/components/pages/standalone-not-found-page/**
  - apps/web/src/components/shared/error-boundary-copy/**
  - apps/web/src/components/shared/error-page-layout/**
  - apps/web/src/components/shared/document-shell/**
  - apps/web/src/metadata/not-found-metadata/**
  - apps/web/src/utils/resolve-not-found-messages/**
  - apps/web/src/utils/guard-page-loader-result/**
  - apps/platform/src/app/[locale]/error.tsx
  - apps/platform/src/app/[locale]/not-found.tsx
epics: []
---

# Errors and 404

## What it does

A reader who hits a missing page sees the tenant's own 404 in its theme and language, with copy the owner can rewrite in Voice and a link home. A render failure inside a page shows a translated error panel with **Try again** and **Go home**; a failure in the site's root layout falls back to a fixed English page that owns the whole document. Every public-site error boundary reports the failure to the server log (see [client-error-capture](./client-error-capture.md)). The platform has its own plain dead-end pages, and its error page reports nothing.

## Surfaces and routes

- `[tenant]/[locale]/not-found.tsx` — `notFound()` from any page under the locale layout; renders inside the layout's providers.
- `[tenant]/not-found.tsx` — `notFound()` thrown by the locale layout itself; owns `<html>` through `DocumentShell`.
- `global-not-found.tsx` — URLs that match no route; resolves no tenant and renders in English with the default theme.
- `[tenant]/[locale]/error.tsx` — `LocaleErrorPage`, below `NextIntlClientProvider`.
- `global-error.tsx` — `GlobalErrorPage`, replaces the document when the locale layout (the root layout) throws; re-imports the global stylesheet.
- The proxy answers some requests with a bare status and no page: 404 for a tenant-shaped or undecodable first path segment, 404 for an unknown host in production, 503 when the tenant lookup fails.
- Platform: `apps/platform/src/app/[locale]/not-found.tsx` and `error.tsx`, both `DeadEndView`.

## Data

- Voice fields (catalogue paths): `notFound.eyebrow`, `notFound.heading`, `notFound.supportingText` (rich), `localeErrorPage.title`, `localeErrorPage.description` (rich). Other strings (`returnHome`, `retry`, `goHome`, `announcement`) are fixed catalogue keys.
- `resolveNotFoundMessages` resolves the catalogue plus the tenant's Voice overrides for boundaries that render outside the locale layout; `getNotFoundContext` supplies the tenant and the served language.
- `GlobalErrorPage` copy is the fixed English `errorBoundaryCopy`.
- 404 metadata: title = the 404 heading, description = its supporting text, both Voice-resolved.

## Configuration

- Owners rewrite the 404 eyebrow, heading and supporting text, and the error page title and description, per language in the platform's Voice page (see [voice](./voice.md)).
- Theme follows the tenant's Look on every 404 that knows its tenant (see [look](./look.md)).
- Not plan-gated. Editors have no Studio control.

## Constraints and invariants

- **Loader failure is a 404.** `guardPageLoaderResult` logs a failed `service.pages.*` result and calls `notFound()`; a loader that matched no document calls `notFound()` silently.
- Paginated archives: a non-numeric or non-canonical page segment 404s; `/page/1` permanently redirects (308) to the unpaginated URL.
- A not-found boundary must never call `headers()`; `global-not-found` and `global-error` never wait on a tenant.
- `GlobalErrorPage` cannot use the catalogue, Voice or `SmartLink` (it sits above every provider) and links home with a plain anchor.
- Error boundaries write their live-region announcement after mount (`aria-live="assertive"`) and move focus to `<main>`; `LocaleErrorPage` reports each distinct error once.

## Dependencies

- Layers: `web`, `platform`, `config` (Voice field registry).
- Features: [voice](./voice.md), [look](./look.md), [languages](./languages.md), [multi-tenancy](./multi-tenancy.md), [client-error-capture](./client-error-capture.md), [seo-and-feeds](./seo-and-feeds.md).
- Env vars: none of its own (the proxy's 404 for unknown hosts follows `NEXT_PUBLIC_SANITY_DATASET`).

## Entry points

- `apps/web/src/app/global-error.tsx`, `apps/web/src/app/global-not-found.tsx`
- `apps/web/src/app/[tenant]/not-found.tsx`, `apps/web/src/app/[tenant]/[locale]/not-found.tsx`, `apps/web/src/app/[tenant]/[locale]/error.tsx`
- `apps/web/src/components/pages/not-found-page/not-found-page.tsx`
- `apps/web/src/components/pages/standalone-not-found-page/standalone-not-found-page.tsx`
- `apps/web/src/components/pages/locale-error-page/locale-error-page.tsx`, `apps/web/src/components/pages/global-error-page/global-error-page.tsx`
- `apps/web/src/utils/guard-page-loader-result/guard-page-loader-result.ts`
- `apps/web/src/server/request-context/request-context.ts` (`getNotFoundContext`)
- `apps/web/src/proxy.ts`

## Tests and stories

- Web tests: `global-error.test.tsx`, `global-not-found.test.tsx`, both `not-found.test.tsx`, `error.test.tsx`, a `*.test.tsx` beside each page component above, `document-shell.test.tsx`, `build-not-found-metadata.test.ts`, `guard-page-loader-result.test.ts`, `proxy.test.ts`.
- Stories: `not-found-page.stories.tsx`, `locale-error-page.stories.tsx`, `global-error-page.stories.tsx`.
- Platform: no tests for its `error.tsx` or `not-found.tsx`.

## Related

- #1880 — decide whether a loader failure should 404 or 500.
- #1785 — manually verify error-boundary announcements with a screen reader.
- #5038 — module, page and error-page intros share one style.
