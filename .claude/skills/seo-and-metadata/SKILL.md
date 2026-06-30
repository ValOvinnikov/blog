---
name: seo-and-metadata
description: >-
  SEO and metadata conventions for apps/web — per-route generateMetadata
  (title/description/canonical/OG/Twitter), JSON-LD structured data, and the
  sitemap.ts / robots.ts / RSS feeds. Use when adding or changing routes,
  metadata, structured data, or feeds. Mostly applies in apps/web.
---

# SEO & metadata (`apps/web`)

Target Lighthouse SEO ≥ 95. Metadata is composed from `siteSettings`
(defaults) and per-document `seo` overrides, both fetched via `@blog/service`.
Canonical origin comes from `NEXT_PUBLIC_SITE_URL`.

## Per-route metadata
- Every route exports `generateMetadata` (dynamic) or a static `metadata`.
- Resolve title as `post.seo?.metaTitle ?? post.title`, description as
  `post.seo?.metaDescription ?? post.excerpt`. Fall back to `siteSettings`.
- Set `metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL!)` in the root
  layout so OG/canonical URLs resolve absolutely.
- Always set `alternates.canonical` to the route's path.
- `openGraph` (type `article` for posts, `website` otherwise) and `twitter`
  (`summary_large_image`) with an OG image — `post.seo?.ogImage` →
  `mainImage` → `siteSettings.ogImage`, run through `urlForImage` at a fixed
  1200×630.

```ts
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const title = post.seo?.metaTitle ?? post.title;
  const description = post.seo?.metaDescription ?? post.excerpt;
  const ogImage = urlForImage(post.seo?.ogImage ?? post.mainImage)?.width(1200).height(630).url();
  return {
    title, description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title, description, images: ogImage ? [ogImage] : [] },
    twitter: { card: "summary_large_image", title, description, images: ogImage ? [ogImage] : [] },
  };
}
```

## Structured data (JSON-LD)
- Post pages embed a `BlogPosting`/`Article` script: `headline`, `datePublished`
  (`post.publishedAt`), `author` (`{ "@type": "Person", name }`), `image`,
  `description`. Render via `<script type="application/ld+json">` with
  `JSON.stringify` — never user-typed HTML.
- Generate `dangerouslySetInnerHTML` only for the serialized JSON-LD object.

## Feeds (all under `apps/web/app`)
- `sitemap.ts` — `MetadataRoute.Sitemap`: home, all post slugs (with
  `lastModified`), categories, pages. Driven by `service` data.
- `robots.ts` — `MetadataRoute.Robots`: allow all, point `sitemap` at
  `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.
- `rss.xml/route.ts` — a Route Handler returning `Content-Type: application/xml`
  built from `getPosts()` (title, link, `pubDate`, description from `excerpt`).

## Rules
- Fetch all SEO inputs through `@blog/service` — no Sanity client in `web`.
- Keep titles ≤ ~60 chars, descriptions ≤ ~155; truncate `excerpt` if needed.
- Re-check `sitemap`/RSS after adding any publicly listed content type.

## Checklist
- [ ] Route has `generateMetadata` with title, description, canonical, OG, Twitter.
- [ ] `metadataBase` set; OG image absolute and 1200×630.
- [ ] Posts emit valid `BlogPosting` JSON-LD.
- [ ] `sitemap.ts` / `robots.ts` / RSS include the new content.
