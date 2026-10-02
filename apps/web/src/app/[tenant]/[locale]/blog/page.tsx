import type { ITenantLocalizedParams } from '@blog/config';
import { PostIndexPage } from '@web/components/pages/post-index-page';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildPostIndexMetadata(1, tenant);
}

export default async function PostIndexRoute({ params }: TProps) {
  const { locale, tenant } = await params;
  await enterRequestContext(params);

  return <PostIndexPage page={1} locale={locale} tenant={tenant} />;
}
