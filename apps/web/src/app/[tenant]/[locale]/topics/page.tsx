import type { ITenantLocalizedParams } from '@blog/config';
import { TopicIndexPage } from '@web/components/pages/topic-index-page';
import { buildTopicIndexMetadata } from '@web/metadata/topic-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildTopicIndexMetadata(tenant);
}

export default async function TopicIndexRoute({ params }: TProps) {
  const { locale, tenant } = await params;
  await enterRequestContext(params);

  return <TopicIndexPage locale={locale} tenant={tenant} />;
}
