import type { ITenantLocalizedParams } from '@blog/config';
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

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  return buildTopicMetadata(slug, tenant);
}

export default async function TopicDetailPage({ params }: TProps) {
  const { locale, tenant, slug } = await params;
  await enterRequestContext(params);

  return <TopicPage slug={slug} locale={locale} tenant={tenant} />;
}
