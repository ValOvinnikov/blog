import type { ILocalizedParams } from '@blog/config';
import { TopicPage } from '@web/components/pages/topic-page';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildTopicMetadata(slug);
}

export default async function TopicDetailPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <TopicPage slug={slug} locale={locale} />;
}
