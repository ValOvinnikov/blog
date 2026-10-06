import type { ITenantLocalizedParams } from '@blog/config';
import { HomePage } from '@web/components/pages/home-page';
import { buildHomePageMetadata } from '@web/metadata/home-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildHomePageMetadata();
}

export default async function HomeRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <HomePage />;
}
