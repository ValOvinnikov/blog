import type { ITenantLocalizedParams } from '@blog/config';
import { TagIndexPage } from '@web/components/pages/tag-index-page';
import { buildTagIndexMetadata } from '@web/metadata/tag-index-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildTagIndexMetadata(tenant);
}

export default async function TagIndexRoutePage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <TagIndexPage locale={locale} tenant={tenant} />;
}
