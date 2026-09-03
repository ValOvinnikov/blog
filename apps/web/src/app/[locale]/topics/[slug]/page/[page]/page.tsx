import { routes, type ILocalizedParams } from '@blog/config';
import { getPlatformSanityContext, service } from '@blog/service';
import { TopicPage } from '@web/components/pages/topic-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
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
// `TopicPage`, not on this list.
export async function generateStaticParams() {
  const result = await service.pages.topic.v1.getTopicPaginationParams(
    getPlatformSanityContext(),
  );

  if (!result.ok) {
    logger.error('topic_pagination.params_fetch_failed', {
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
  return buildTopicMetadata(slug, page);
}

export default async function TopicNumberedPage({ params }: TProps) {
  const { locale, slug, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /topics/{slug}. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.topic(slug, 1), locale });
  }

  return <TopicPage slug={slug} page={page} locale={locale} />;
}
