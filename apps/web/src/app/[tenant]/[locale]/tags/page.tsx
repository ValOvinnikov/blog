import type { ITenantLocalizedParams } from '@shinefold/config';
import { TagIndexPage } from '@web/components/pages/tag-index-page';
import { buildTagIndexMetadata } from '@web/metadata/tag-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildTagIndexMetadata();
}

export default async function TagIndexRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <TagIndexPage />;
}
