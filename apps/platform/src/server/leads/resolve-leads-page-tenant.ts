import 'server-only';

import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { notFound } from 'next/navigation';

export const resolveLeadsPageTenant = async () => {
  const context = await resolveDashboardTenant();
  const { tenant, membership } = context;
  const access = await resolveTenantPageAccess(tenant, membership);

  if (!access.leads) notFound();

  return context;
};
