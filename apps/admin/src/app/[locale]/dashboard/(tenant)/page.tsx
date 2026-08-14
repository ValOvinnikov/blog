import { TenantOverview } from '@admin/components/tenant-overview';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenant') };
}

export default async function DashboardOverviewPage() {
  const { tenant } = await resolveDashboardTenant();

  return <TenantOverview tenantName={tenant.name} />;
}
