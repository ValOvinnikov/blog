import type { ILocalizedParams } from '@blog/config';
import { GenericPage } from '@web/components/pages/generic-page';
import { buildGenericPageMetadata } from '@web/metadata/generic-page-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams & { tenant: string; slug: string }>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { slug } = await params;
  return buildGenericPageMetadata(slug);
}

export default async function GenericSlugPage({ params }: TProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <GenericPage slug={slug} locale={locale} />;
}
