import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { TopicPage } from '@web/components/pages/topic-page';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { logger } from '@web/utils/logger/logger';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug still renders on demand.
export async function generateStaticParams() {
  const result = await service.pages.topic.v1.getTopicParams();

  if (!result.ok) {
    logger.error('topic_page.params_fetch_failed', { error: result.error });
    return [];
  }

  return result.data;
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildTopicMetadata(slug);
}

export default async function TopicDetailPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <TopicPage slug={slug} />;
}
