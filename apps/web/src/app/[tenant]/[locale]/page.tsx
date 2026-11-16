import type { ITenantLocalizedParams } from '@shinefold/config';
import { HomePage } from '@web/components/pages/home-page';
import { buildHomePageMetadata } from '@web/metadata/home-page-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildHomePageMetadata();
}

export default async function HomeRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <HomePage />;
}
