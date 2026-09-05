import type { ITenantLocalizedParams } from '@blog/config';
import { TagsPage } from '@web/components/pages/tags-page';
import { buildTagsMetadata } from '@web/metadata/tags-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildTagsMetadata(tenant);
}

export default async function TagsIndexPage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <TagsPage tenant={tenant} />;
}
