import { routes, type ILocalizedParams } from '@blog/config';
import { getPlatformSanityContext, service } from '@blog/service';
import { TagPage } from '@web/components/pages/tag-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { logger } from '@web/utils/logger/logger';
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
// `TagPage`, not on this list.
export async function generateStaticParams() {
  const result = await service.pages.tag.v1.getTagPaginationParams(
    getPlatformSanityContext(),
  );

  if (!result.ok) {
    logger.error('tag_pagination.params_fetch_failed', {
      error: result.error,
    });
    return [];
  }

  return result.data;
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildTagMetadata(slug, page);
}

export default async function TagNumberedPage({ params }: TProps) {
  const { locale, slug, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /tags/{slug}. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.tag(slug, 1), locale });
  }

  return <TagPage slug={slug} page={page} locale={locale} />;
}
