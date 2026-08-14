import { TenantOverview } from '@admin/components/tenant-overview';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenant') };
}

export default async function TenantOverviewPage({ params }: TProps) {
  const { tenantSlug } = await params;

  return <TenantOverview tenantSlug={tenantSlug} />;
}
