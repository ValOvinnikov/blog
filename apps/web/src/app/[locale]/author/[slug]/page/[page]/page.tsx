import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { AuthorPage } from '@web/components/pages/author-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildAuthorMetadata } from '@web/metadata/author-metadata';
import { AUTHOR_ITEMS_PER_PAGE } from '@web/utils/author-items-per-page';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string; page: string }>;
};

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug/page pair still renders
// on demand via ISR — correctness rides on the explicit range check in
// `AuthorPage`, not on this list.
export async function generateStaticParams() {
  try {
    return await service.entities.author.v1.getAuthorPaginationParams(
      AUTHOR_ITEMS_PER_PAGE,
    );
  } catch (error) {
    console.error(`Error to fetch author pagination params: ${error}`);
    return [];
  }
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildAuthorMetadata(slug, page);
}

export default async function AuthorNumberedPage({ params }: TProps) {
  const { locale, slug, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /author/{slug}. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.author(slug, 1), locale });
  }

  return <AuthorPage slug={slug} page={page} locale={locale} />;
}
