import type { ITenantLocalizedParams } from '@blog/config';
import { TagsPage } from '@web/components/pages/tags-page';
import { buildTagsMetadata } from '@web/metadata/tags-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildTagsMetadata(tenant);
}

export default async function TagsIndexPage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <TagsPage tenant={tenant} />;
}
