import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { buildBlogListMetadata } from '@web/components/blog-list-page/blog-list-metadata';
import { BlogListPage } from '@web/components/blog-list-page/blog-list-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { page: string }>;
};

// Pages beyond the build-time list still render on demand via ISR
// (dynamicParams defaults to true); correctness rides on the explicit
// range check in BlogListPage, not on this list.
export async function generateStaticParams() {
  const result = await service.pages.blog.v1.getBlogPageCount();
  if (!result.ok) {
    console.error(`Error to fetch blog page count: ${result.error}`);
    return [];
  }

  return Array.from({ length: Math.max(0, result.data - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildBlogListMetadata(page);
}

export default async function BlogListNumberedPage({ params }: TProps) {
  const { locale, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /blog. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.blogIndex(1), locale });
  }

  return <BlogListPage page={page} locale={locale} />;
}
