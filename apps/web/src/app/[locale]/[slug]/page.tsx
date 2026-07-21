import type { ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import { GenericPage } from '@web/components/pages/generic-page';
import { buildGenericPageMetadata } from '@web/metadata/generic-page-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { slug: string }>;
};

// CI's build environment can't always construct the Sanity client; an
// uncaught throw here would crash the entire `next build`. `dynamicParams`
// stays default `true`, so a missed build-time slug still renders on demand.
export async function generateStaticParams() {
  const result = await service.pages.generic.v1.getPageSlugs();

  if (!result.ok) {
    console.error('Error to fetch generic page slugs:', result.error);
    return [];
  }

  return result.data.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildGenericPageMetadata(slug);
}

export default async function GenericSlugPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <GenericPage slug={slug} locale={locale} />;
}
