import type { ITenantLocalizedParams } from '@blog/config';
import { TopicPage } from '@web/components/pages/topic-page';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  return buildTopicMetadata(slug, tenant);
}

export default async function TopicDetailPage({ params }: TProps) {
  const { locale, tenant, slug } = await params;
  setRequestLocale(locale);

  return <TopicPage slug={slug} locale={locale} tenant={tenant} />;
}
