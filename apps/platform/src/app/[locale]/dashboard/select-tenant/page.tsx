import { DashboardTenantPicker } from '@platform/components/features/layout/dashboard-tenant-picker';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('selectTenant');
}

export default async function SelectTenantPage() {
  const { memberships, tenants } = await listSessionTenants();

  if (memberships.length === 1) {
    redirect(adminRoutes.dashboard());
  }

  return <DashboardTenantPicker tenants={tenants} />;
}
