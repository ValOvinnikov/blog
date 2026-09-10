---
name: seo-and-metadata
description: >-
  SEO and metadata conventions for apps/web — per-route generateMetadata
  (title/description/canonical/OG/Twitter), JSON-LD structured data, and the
  sitemap.ts / robots.ts / RSS feeds. Use when adding or changing routes,
  metadata, structured data, or feeds. Mostly applies in apps/web.
---

# SEO & metadata (`apps/web`)

Target Lighthouse SEO ≥ 95. Canonical origin comes from the resolved tenant's
`primaryDomain`, falling back to `NEXT_PUBLIC_SITE_URL` (`getTenantBaseUrl()`,
feeding `metadataBase` in `[locale]/layout.tsx`).

**The service layer owns SEO resolution, and it is authored-only.** Page
view-models from `@blog/service` carry `seo: TSeoResolved` holding exactly
what an editor typed. There is **no fallback ladder** — no content-derived
tier, no site defaults. Anything unauthored is `undefined` and must be
**omitted** from the document head, never emitted as an empty tag:

```ts
type TSeoResolved = {
  title: string; // page-part only — the layout template appends "| Brand"
  description: TMaybeUndefined<string>;
  ogTitle: TMaybeUndefined<string>;
  ogDescription: TMaybeUndefined<string>;
  ogImageUrl: TMaybeUndefined<string>; // absolute, 1200×630
};
```

`title` is the only guaranteed field: `seo.metaTitle` is required in Studio
(30–60 characters) and `resolveSeo` throws `MissingSeoTitleError` rather than
invent one. There is no site-wide default OG image, so `twitter:card` must be
`summary_large_image` only when an image was authored and `summary` otherwise.

> **Fallbacks on SEO are forbidden.** A new case is surfaced to a human, not
> resolved by whoever meets it. Current shape documented in `SPEC.md` §10.

## Per-route metadata

- Every route exports `generateMetadata` mapping the view-model's `seo`
  through the shared helper — never inline OG/Twitter objects per route:

```ts
// apps/web/src/app/[locale]/blog/[slug]/page.tsx
export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await service.pages.post.v1.getPostBySlug(slug);
  if (!result.ok) return {}; // page render will notFound(); no fallback fetch

  return toMetadata(result.data.seo, {
    canonical: routes.post(slug),
    ogType: 'article',
  });
}
```

- **Never re-derive SEO in web.** No `post.seo?.metaTitle ?? post.title`
  chains, no `siteSettings` fetch "just for metadata", no image URL building —
  all of that already happened in the service.
- **Error path:** a failed loader `Result` returns `{}`. Do not fetch
  siteSettings to hand-roll fallback metadata — the page 404s anyway.
- **Canonicals are locale-less paths** from the `routes` helpers in
  `@blog/config` (`'/'`, `routes.blogIndex(page)`) — never prefix `locale`.
- **Titles:** `seo.title` is the page part; the layout owns the `%s | Brand`
  template. The home route passes `titleAbsolute: true` so the brand isn't
  doubled ("Brand | Brand").
- **Blog pagination:** every page self-canonicalizes — page N →
  `/blog/page/N`, **never** `/blog` (spec do-not-change rule). Web appends the
  `– Page N` title suffix (presentation/i18n, #321); the base title comes from
  the resolved seo.
- `ogType`: `'article'` for posts (plus `publishedTime`/`authors` from the
  view-model), `'website'` otherwise.

## Structured data (JSON-LD)

- Post pages embed a `BlogPosting` script: `headline`, `datePublished`
  (`post.publishedAt`), `author` (`{ "@type": "Person", name }`), `image`
  (post image URL from the view-model), `description`. Render via
  `<script type="application/ld+json">` with `JSON.stringify` — never
  user-typed HTML; `dangerouslySetInnerHTML` only for the serialized object.

## Feeds (all under `apps/web/src/app`)

- `sitemap.ts` — `MetadataRoute.Sitemap`: home, all post slugs (with
  `lastModified`), categories, pages. Driven by `service` data.
- `robots.ts` — allow all, `sitemap` at `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.
- `rss.xml/route.ts` — Route Handler, `Content-Type: application/xml`, built
  from the posts loader (title, link, `pubDate`, description from `excerpt`;
  channel description from `siteSettings.description`).

## Rules

- Fetch all SEO inputs through `@blog/service` — no Sanity client in `web`.
- Re-check `sitemap`/RSS after adding any publicly listed content type.

## Checklist

- [ ] Route maps `seo` via `toMetadata` (canonical, ogType; `titleAbsolute`
      only for home). No inline `??` resolution, no extra settings fetch.
- [ ] Canonical is a locale-less `routes` helper path; blog page N
      self-canonicalizes.
- [ ] Posts emit valid `BlogPosting` JSON-LD.
- [ ] `sitemap.ts` / `robots.ts` / RSS include the new content.
