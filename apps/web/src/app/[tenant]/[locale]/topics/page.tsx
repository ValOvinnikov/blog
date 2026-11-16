import type { ITenantLocalizedParams } from '@shinefold/config';
import { TopicIndexPage } from '@web/components/pages/topic-index-page';
import { buildTopicIndexMetadata } from '@web/metadata/topic-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildTopicIndexMetadata();
}

export default async function TopicIndexRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <TopicIndexPage />;
}
