import { routes, type ITenantLocalizedParams } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { TopicPage } from '@web/components/pages/topic-page';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import {
  resolveNumberedPage,
  toNumberedMetadataPage,
} from '@web/utils/resolve-numbered-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string; page: string }>;
};

export function generateStaticParams() {
  return [];
}

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { slug, page: rawPage } = await params;
  const page = toNumberedMetadataPage(rawPage);
  if (isNull(page)) return {};
  return buildTopicMetadata(slug, page);
}

export default async function TopicNumberedPage({ params }: TProps) {
  const { slug, page: rawPage } = await params;
  await enterRequestContext(params);

  const page = await resolveNumberedPage(rawPage, routes.topic(slug, 1));

  return <TopicPage slug={slug} page={page} />;
}
