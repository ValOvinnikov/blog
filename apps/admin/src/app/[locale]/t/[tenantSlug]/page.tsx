import { TenantOverview } from '@admin/components/tenant-overview';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
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
  const { tenant } = await requireTenantMembership(tenantSlug);

  return <TenantOverview tenantName={tenant.name} />;
}
