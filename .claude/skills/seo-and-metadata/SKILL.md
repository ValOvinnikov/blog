---
name: seo-and-metadata
description: >-
  SEO and metadata conventions for apps/web — per-route generateMetadata
  (title/description/canonical/OG/Twitter), JSON-LD structured data, and the
  sitemap.ts / robots.ts / RSS feeds. Use when adding or changing routes,
  metadata, structured data, or feeds. Mostly applies in apps/web.
---

# SEO & metadata (`apps/web`)

Target Lighthouse SEO ≥ 95. The canonical origin is the resolved tenant's
`primaryDomain`, falling back to `NEXT_PUBLIC_SITE_URL` — `getTenantBaseUrl()`
for robots, sitemap and feeds, `metadataBase` from `await getRequestContext()`
for page metadata and JSON-LD.

## SEO is authored-only

Page view-models carry `seo: TSeoResolved` (`resolveSeo` in
`packages/service/src/shared/transformers/seo/`): `title`, plus `description`,
`ogTitle`, `ogDescription` and `ogImage`, each `undefined` when the editor left
it empty. No fallback ladder — no content-derived tier, no site defaults, nothing
inherited from the locale layout. Unauthored fields are **omitted** from the
head, never emitted empty.

- `title` is the only guaranteed field: `seo.metaTitle` is required in Studio
  (30–60 characters), and the query projects `seo` and `metaTitle` `.notNull()`,
  so a document missing either 404s through the page-loader guard.
- `og:title` never inherits the meta title, and there is no default or
  post-hero OG image — `twitter:card` is `summary_large_image` only when an image
  was authored, `summary` otherwise.

**Fallbacks on SEO are forbidden.** A new case goes to a human, not resolved by
whoever meets it. The one exception is the RSS channel `<description>`, which
RSS 2.0 requires, so feeds fall back (see "Sitemap, robots, feeds"). Full
contract: `SPEC.md` §10.

## Per-route metadata

Every route's `generateMetadata` calls `enterRequestContext(params)`, then
returns a builder from `apps/web/src/metadata/<page>-metadata/`. The builder
fetches through the page's own `@web/server/<page>/get-<page>-page` loader and
maps `seo` through `toLocalizedPageMetadata` (which wraps `toMetadata`) — never
an inline OG/Twitter object. Model a new one on `build-post-metadata.ts`.

- **Never re-derive SEO in web** — no `seo?.metaTitle ?? title` chains, no
  `siteSettings` fetch "just for metadata". SEO image URLs come only from
  `@blog/service`'s `urlForSanityImage` — `toMetadata` for `seo.ogImage`,
  `buildBlogPostingSchema` for the post hero; never hand-build one.
- **Error path:** a failed loader logs and returns `{}`; a missing document
  returns `{}`. Never hand-roll fallback metadata — the page 404s anyway.
- **`href` is a locale-less `routes` path** from `@blog/config`.
  `toLocalizedPageMetadata` localizes the canonical and `og:url` and adds
  hreflang and `og:locale:alternate` for live translations — never prefix a
  locale yourself.
- **Titles:** `seo.title` is the page part; the locale layout owns the
  `%s | Brand` template. Only the home builder passes `titleAbsolute: true`.
- **Pagination** (blog, topic, tag): page N self-canonicalizes
  (`/blog/page/N`), **never** to page 1. The builder appends the translated
  `pagination.pageSuffix` to `title` (and `ogTitle` when authored); pages 2+
  pass no translations, so carry no hreflang.
- `ogType` is `'article'` for posts (with `article.publishedTime`/`authors`),
  `'website'` otherwise. Only the blog index and tag builders (the two pages
  with feeds) pass `feedUrl` for the RSS alternate link.
- Auth-gated pages (`account`, `bookmarks`) have no `seo`: their builders use
  translated copy and `robots: { index: false, follow: false }`.

## Structured data (JSON-LD)

- Render every schema through `JsonLd` (`@web/components/shared/json-ld`), which
  escapes `<`, `>` and `&` — never hand-roll `<script type="application/ld+json">`.
- Build each schema in an `apps/web/src/utils/build-*-schema/` util:
  `BlogPosting` on posts, `BreadcrumbList` beside every breadcrumb trail,
  `FAQPage` (via `FaqPageSchema`) on home, landing, topic and tag pages that
  carry FAQ modules.
- Schema URLs are absolute (`new URL(toLocalizedPathname(…), metadataBase)`);
  with no `metadataBase` the builder returns `undefined` and nothing renders.

## Sitemap, robots, feeds

- `app/sitemap.ts` — the host tenant's home, indexes and their pages, posts
  (with `lastModified`), topics, tags and landing pages, with per-language
  alternates for live locales.
- `app/robots.ts` — allows all crawlers; lists the sitemap in production only.
  Elsewhere the layout's `noindex, nofollow` meta de-indexes — never
  `Disallow: /`, which stops crawlers ever fetching that `noindex`.
- `[tenant]/[locale]/rss.xml` and `…/tags/[slug]/rss.xml` — one feed per
  language via `getFeedContext` + `buildRssFeed`. RSS 2.0 requires a channel
  `<description>`: the site feed falls back from the blog index `seo.description`
  to the brand `tagline` to `rss.fallbackDescription`; the tag feed from the
  tag's `description` to its title.
- Re-check the sitemap and RSS after adding any publicly listed content type.

## Checklist

- [ ] `generateMetadata` enters the request context and returns a
      `build-*-metadata` builder mapping `seo` via `toLocalizedPageMetadata`;
      no inline `??` resolution, no extra settings fetch.
- [ ] Locale-less `routes` `href`; page N self-canonicalizes, no hreflang past
      page 1; `titleAbsolute` only for home.
- [ ] JSON-LD via `JsonLd` and a `build-*-schema` util; posts emit `BlogPosting`.
- [ ] `sitemap.ts` / `robots.ts` / RSS include the new content.
