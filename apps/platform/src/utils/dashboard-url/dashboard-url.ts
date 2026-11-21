import { adminRoutes } from '@platform/utils/routes/routes';

export const dashboardUrl = (tenantId: string, baseUrl: string): string =>
  new URL(adminRoutes.dashboardSelectTenantHref(tenantId), baseUrl).toString();
