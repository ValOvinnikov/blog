---
title: SEO and feeds
status: built
layers: [studio, service, web]
code:
  - packages/studio/src/schema-types/objects/seo/**
  - packages/studio/src/schema-types/objects/open-graph/**
  - packages/service/src/shared/fragments/seo/**
  - packages/service/src/shared/transformers/seo/**
  - apps/web/src/metadata/**
  - apps/web/src/app/sitemap.ts
  - apps/web/src/app/robots.ts
  - apps/web/src/app/icon.tsx
  - apps/web/src/app/[tenant]/[locale]/rss.xml/**
  - apps/web/src/app/[tenant]/[locale]/tags/[slug]/rss.xml/**
  - apps/web/src/server/feed/**
  - apps/web/src/utils/build-rss-feed/**
  - apps/web/src/utils/build-blog-posting-schema/**
  - apps/web/src/utils/build-breadcrumb-list-schema/**
  - apps/web/src/utils/build-faq-page-schema/**
  - apps/web/src/utils/is-production-environment/**
  - apps/web/src/utils/with-language-alternates/**
  - apps/web/src/components/shared/json-ld/**
  - apps/web/src/components/features/faq-page-schema/**
  - apps/web/src/components/features/post/blog-posting-schema/**
epics: []
---

# SEO and feeds

## What it does

Every public page emits the title, description, canonical, Open Graph and Twitter tags its editor authored in the page's SEO block, plus `hreflang` alternates for its live translations; paginated pages (page 2 onward) carry no cross-language alternates. Posts, breadcrumbs and FAQ modules add JSON-LD. Each tenant serves its own `sitemap.xml`, `robots.txt`, favicon, a site-wide RSS feed per language and a feed per tag. Everything outside the production environment is `noindex, nofollow`.

## Surfaces and routes

- `/sitemap.xml`, `/robots.txt`, `/icon` — per tenant, resolved from the request host.
- `/[locale]/rss.xml` (site feed) and `/[locale]/tags/<slug>/rss.xml` (tag feed); the blog index and tag pages advertise them with `<link rel="alternate" type="application/rss+xml">`.
- Studio: the **SEO** block (`seo` object via `seoField()`) on home, landing, post, post index, taxonomy index, topic and tag documents, rendered expanded.

## Data

- `seo`: `metaTitle` (required, 30–60 characters), `metaDescription` (max 160), `openGraph` (`ogTitle`, `ogDescription`, `ogImage`).
- `seoFragment` makes `metaTitle` non-null, and every page query projects `seo` with `.notNull()`; `resolveSeo` maps the authored object to `TSeoResolved` with no fallbacks.
- JSON-LD: `BlogPosting` on the post page (headline, excerpt, hero image, `datePublished`, author, tag keywords, `inLanguage`), `BreadcrumbList` from each page's breadcrumbs component, and `FAQPage` on home, landing, topic and tag pages that carry FAQ modules.
- Sitemap entries: home, blog index and its pages, topics and tags indexes, posts (`lastModified` = `publishedAt`), topic and tag pages with pagination, and landing pages, each with absolute `hreflang` alternates across live translations, except paginated pages (page 2 onward), which carry a self alternate only.
- Feeds and the sitemap are cached like any other route (see [rendering-and-caching](./rendering-and-caching.md)).

## Configuration

- Editors author every SEO field per page in the Studio. There is no site-level SEO setting.
- Which languages appear in alternates and the sitemap follows the tenant's live languages (see [languages](./languages.md)).
- The favicon is the tenant's Look favicon upload, with an inline fallback mark ([look](./look.md)).
- Not plan-gated; no Look or Voice reach.

## Constraints and invariants

- **Authored-only SEO** — an unauthored description, OG title, OG description or OG image is omitted, never inherited from another field, the layout or a site default. A new fallback is a product decision, not an implementation choice.
- A page document missing `seo` or `metaTitle` fails to parse and the route 404s through the page-loader guard; Studio validation is the editing experience, the query is the guarantee.
- The document's own `title` never reaches metadata.
- Twitter card is `summary_large_image` only when an OG image is authored, else `summary`.
- Canonicals are self-referencing, language-prefixed per the `as-needed` scheme, including paginated pages.
- **Indexing gate** — `isProductionEnvironment()` (`NEXT_PUBLIC_SANITY_DATASET === 'production'`) is the single discriminator. Outside production the locale layout emits `robots: noindex, nofollow` on every page and `robots.txt` allows crawling but omits the sitemap, so crawlers can still see the `noindex`.
- `account` and `bookmarks` metadata is always `noindex`.
- JSON-LD is serialised through `JsonLd`, which escapes `&`, `<` and `>` so string content cannot close the script element.
- Feeds list only published posts in the requested language, and the sitemap lists published posts in every live language; a scheduled post is absent from both.
- The site feed tolerates a failed site-settings or index-page fetch (generic catalogue title and description); its channel description is the blog index's `metaDescription`, then the header tagline (`settings_navigation`, read through `getNavigation`; a failed read is logged and skipped), then the catalogue fallback. The tag feed 404s on any failed tag or post fetch.
- The sitemap returns empty when the tenant has no base URL or no resolvable Sanity context, and drops any section whose fetch failed (each logged).

## Dependencies

- Layers: `studio` (seo object), `service` (fragment, `resolveSeo`, page loaders, params queries, feed queries), `web` (metadata builders, route handlers, JSON-LD).
- Features: [page-types](./page-types.md), [posts](./posts.md), [topics-and-tags](./topics-and-tags.md), [landing-tree](./landing-tree.md), [faq-module](./faq-module.md), [languages](./languages.md), [multi-tenancy](./multi-tenancy.md), [rendering-and-caching](./rendering-and-caching.md).
- Env vars: `NEXT_PUBLIC_SANITY_DATASET` (indexing gate), `NEXT_PUBLIC_SITE_URL` (base URL when a tenant has no primary domain).

## Entry points

- `apps/web/src/metadata/to-metadata.ts`, `apps/web/src/metadata/to-localized-page-metadata/to-localized-page-metadata.ts`, `apps/web/src/metadata/*/build-*-metadata.ts`
- `apps/web/src/app/[tenant]/[locale]/layout.tsx` (`generateMetadata`, robots gate)
- `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`, `apps/web/src/app/icon.tsx`
- `apps/web/src/app/[tenant]/[locale]/rss.xml/route.ts`, `apps/web/src/app/[tenant]/[locale]/tags/[slug]/rss.xml/route.ts`, `apps/web/src/server/feed/get-feed-context/get-feed-context.ts`
- `apps/web/src/components/shared/json-ld/json-ld.tsx`
- `packages/service/src/shared/transformers/seo/resolve-seo.ts`
- `packages/studio/src/schema-types/objects/seo/seo.ts`, `seo-field.ts`

## Tests and stories

- Web: `sitemap.test.ts`, `robots.test.ts`, `icon.test.tsx`, both `rss.xml/route.test.ts`, `build-rss-feed.test.ts`, `to-metadata.test.ts`, `to-localized-page-metadata.test.ts`, every `build-*-metadata.test.ts`, `json-ld.test.tsx`, `faq-page-schema.test.tsx`, `blog-posting-schema.test.tsx`, `build-*-schema.test.ts`, `is-production-environment.test.ts`, `layout.test.tsx`.
- Service: `resolve-seo.test.ts`.
- No stories.

## Related

- #3778 — video structured data for embedded videos.
- #965 — agent-native blog: `llms.txt`, markdown endpoints, MCP server.
