import type { ILocalizedParams } from '@blog/config';
import { createLogger } from '@blog/insight';
import { service } from '@blog/service';
import { AuthorPage } from '@web/components/pages/author-page';
import { buildAuthorMetadata } from '@web/metadata/author-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

const logger = createLogger();

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug still renders on demand.
export async function generateStaticParams() {
  const result = await service.pages.author.v1.getAuthorParams();

  if (!result.ok) {
    logger.error('author_page.params_fetch_failed', { error: result.error });
    return [];
  }

  return result.data;
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildAuthorMetadata(slug);
}

export default async function AuthorDetailPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <AuthorPage slug={slug} />;
}
