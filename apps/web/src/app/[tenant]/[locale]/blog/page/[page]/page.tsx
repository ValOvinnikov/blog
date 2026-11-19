import { routes, type ITenantLocalizedParams } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { PostIndexPage } from '@web/components/pages/post-index-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { parsePageParam } from '@web/utils/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
  const page = parsePageParam(rawPage);
  if (isNull(page) || page < 2) return {};
  return buildPostIndexMetadata(page);
}

export default async function PostIndexNumberedPage({ params }: TProps) {
  const { locale, page: rawPage } = await params;
  await enterRequestContext(params);

  const page = parsePageParam(rawPage);

  if (isNull(page)) {
    notFound();
  }

  if (page === 1) {
    permanentRedirect({ href: routes.blogIndex(1), locale });
  }

  return <PostIndexPage page={page} />;
}
