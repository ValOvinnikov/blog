import { DashboardTenantPicker } from '@platform/components/features/layout/dashboard-tenant-picker';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('selectTenant') };
}

/**
 * The slug-free dashboard's tenant picker — reached when
 * `resolveDashboardTenant` finds more than one membership and no (or a
 * stale) active-tenant cookie. A single-membership session redirects
 * straight past this to `/dashboard`: it's only ever reachable when there's
 * genuinely a choice to make. Deliberately outside the `(tenant)` route
 * group's gated layout, since that layout would redirect right back here.
 */
export default async function SelectTenantPage() {
  const { memberships, tenants } = await listSessionTenants();

  if (memberships.length === 1) {
    redirect(adminRoutes.dashboard());
  }

  return <DashboardTenantPicker tenants={tenants} />;
}
