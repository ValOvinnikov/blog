import type { ITenantLocalizedParams } from '@shinefold/config';
import { TopicPage } from '@web/components/pages/topic-page';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { slug } = await params;
  return buildTopicMetadata(slug);
}

export default async function TopicDetailPage({ params }: TProps) {
  const { slug } = await params;
  await enterRequestContext(params);

  return <TopicPage slug={slug} />;
}
