import { routes, type ITenantLocalizedParams } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { TopicPage } from '@web/components/pages/topic-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTopicMetadata } from '@web/metadata/topic-metadata';
import { enterRequestContext } from '@web/server/request-context/request-context';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
  const page = parsePageParam(rawPage);
  if (isNull(page) || page < 2) return {};
  return buildTopicMetadata(slug, page);
}

export default async function TopicNumberedPage({ params }: TProps) {
  const { locale, slug, page: rawPage } = await params;
  await enterRequestContext(params);

  const page = parsePageParam(rawPage);

  if (isNull(page)) {
    notFound();
  }

  if (page === 1) {
    permanentRedirect({ href: routes.topic(slug, 1), locale });
  }

  return <TopicPage slug={slug} page={page} />;
}
