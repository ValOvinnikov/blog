import type { ITenantLocalizedParams } from '@blog/config';
import { GenericPage } from '@web/components/pages/generic-page';
import { buildGenericPageMetadata } from '@web/metadata/generic-page-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  return buildGenericPageMetadata(slug, tenant);
}

export default async function GenericSlugPage({ params }: TProps) {
  const { locale, tenant, slug } = await params;
  setRequestLocale(locale);

  return <GenericPage slug={slug} locale={locale} tenant={tenant} />;
}
