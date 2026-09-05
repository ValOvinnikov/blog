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

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  return buildGenericPageMetadata(slug, tenant);
}

export default async function GenericSlugPage({ params }: TProps) {
  const { locale, tenant, slug } = await params;
  setRequestLocale(locale);

  return <GenericPage slug={slug} locale={locale} tenant={tenant} />;
}
