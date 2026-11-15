import type { ITenantLocalizedParams } from '@shinefold/config';
import { PostIndexPage } from '@web/components/pages/post-index-page';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  return buildPostIndexMetadata(1);
}

export default async function PostIndexRoute({ params }: TProps) {
  await enterRequestContext(params);

  return <PostIndexPage page={1} />;
}
