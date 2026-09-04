import type { ITenantLocalizedParams } from '@blog/config';
import { TopicsPage } from '@web/components/pages/topics-page';
import { buildTopicsMetadata } from '@web/metadata/topics-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams>;
};

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant } = await params;
  return buildTopicsMetadata(tenant);
}

export default async function TopicsIndexPage({ params }: TProps) {
  const { locale, tenant } = await params;
  setRequestLocale(locale);

  return <TopicsPage tenant={tenant} />;
}
