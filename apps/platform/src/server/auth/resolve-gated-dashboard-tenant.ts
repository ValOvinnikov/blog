import 'server-only';

import {
  resolveDashboardTenant,
  type TDashboardTenantContext,
} from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import type { TPlanPage } from '@platform/utils/plan-page-access/plan-page-access';
import { notFound } from 'next/navigation';

export const resolveGatedDashboardTenant =
  (page: TPlanPage) => async (): Promise<TDashboardTenantContext> => {
    const context = await resolveDashboardTenant();
    const access = await resolveTenantPageAccess(context);

    if (!access[page]) notFound();

    return context;
  };
