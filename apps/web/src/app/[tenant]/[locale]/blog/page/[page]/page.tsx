import { routes, type ITenantLocalizedParams } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { PostIndexPage } from '@web/components/pages/post-index-page';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import {
  resolveNumberedPage,
  toNumberedMetadataPage,
} from '@web/utils/resolve-numbered-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<ITenantLocalizedParams & { page: string }>;
};

export function generateStaticParams() {
  return [];
}

export const revalidate = 86400;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  await enterRequestContext(params);
  const { page: rawPage } = await params;
  const page = toNumberedMetadataPage(rawPage);
  if (isNull(page)) return {};
  return buildPostIndexMetadata(page);
}

export default async function PostIndexNumberedPage({ params }: TProps) {
  const { page: rawPage } = await params;
  await enterRequestContext(params);

  const page = await resolveNumberedPage(rawPage, routes.blogIndex(1));

  return <PostIndexPage page={page} />;
}
