/**
 * Single source of truth for apps/admin's own URL construction — never build
 * these paths inline elsewhere.
 */
export const adminRoutes = {
  tenants: (options?: { archived?: boolean }) =>
    options?.archived ? '/tenants?archived=1' : '/tenants',
  addTenant: () => '/add-tenant',
  tenantStatus: (tenantId: string) => `/tenants/${tenantId}`,
  tenant: (tenantSlug: string) => `/t/${tenantSlug}`,
  look: (tenantSlug: string) => `/t/${tenantSlug}/look`,
  voice: (tenantSlug: string) => `/t/${tenantSlug}/voice`,
  dashboard: () => '/dashboard',
  dashboardLook: () => '/dashboard/look',
  dashboardVoice: () => '/dashboard/voice',
  dashboardSelectTenant: () => '/dashboard/select-tenant',
  /** The picker's link target — verifies `tenantId` against the session's own `memberships` before setting the "active tenant" cookie. */
  dashboardSelectTenantHref: (tenantId: string) =>
    `/api/dashboard/select-tenant?tenantId=${tenantId}`,
} as const;
