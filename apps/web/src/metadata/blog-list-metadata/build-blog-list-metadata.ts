import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { TBlogIndexPage, TSiteSettings } from '@blog/service';
import type { Metadata } from 'next';

/**
 * Metadata for a blog list page. Every page self-canonicalizes — page 2+
 * must NEVER canonical to /blog (spec do-not-change rule).
 *
 * Reuses `getIndexPage` (also called by `BlogListPage`) — Next dedupes the
 * fetch per request, so this adds no extra round-trip.
 */
export async function buildBlogListMetadata(page: number): Promise<Metadata> {
  const [indexPageResult, settingsResult] = await Promise.all([
    service.pages.blog.v1.getIndexPage({ page }),
    service.global.siteSettings.v1.getSiteSettings(),
  ]);

  let indexPage: TBlogIndexPage | null = null;
  if (indexPageResult.ok) {
    indexPage = indexPageResult.data;
  }

  let settings: TSiteSettings | null = null;
  if (settingsResult.ok) {
    settings = settingsResult.data;
  }

  const base =
    indexPage?.seo?.metaTitle ??
    indexPage?.seo?.ogTitle ??
    indexPage?.heading ??
    settings?.ogTitle ??
    settings?.brand.name ??
    'Blog';
  // "– Page N" stays a hardcoded suffix until translation messages land (#321).
  const title = page === 1 ? base : `${base} – Page ${page}`;
  const description =
    indexPage?.seo?.metaDescription ??
    indexPage?.seo?.ogDescription ??
    settings?.ogDescription ??
    settings?.description ??
    '';
  const ogTitle = indexPage?.seo?.ogTitle ?? title;
  const ogDescription = indexPage?.seo?.ogDescription ?? description;
  const imageUrl = indexPage?.seo?.ogImageUrl ?? settings?.ogImageUrl;
  const images = imageUrl ? [{ url: imageUrl }] : [];

  return {
    title,
    description,
    alternates: { canonical: routes.blogIndex(page) },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: images.map((image) => image.url),
    },
  };
}
