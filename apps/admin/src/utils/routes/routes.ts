/**
 * Single source of truth for apps/admin's own URL construction — never build
 * these paths inline elsewhere.
 */
export const adminRoutes = {
  signIn: () => '/api/auth/signin',
  workspacePending: () => '/workspace-pending',
  tenants: (options?: { archived?: boolean }) =>
    options?.archived ? '/tenants?archived=1' : '/tenants',
  newTenant: () => '/tenants/new',
  tenantOverview: (tenantId: string) => `/tenants/${tenantId}`,
  tenantProvisioning: (tenantId: string) => `/tenants/${tenantId}/provisioning`,
  tenantDanger: (tenantId: string) => `/tenants/${tenantId}/danger`,
  tenantDomain: (tenantId: string) => `/tenants/${tenantId}/domain`,
  look: (tenantId: string) => `/tenants/${tenantId}/look`,
  voice: (tenantId: string) => `/tenants/${tenantId}/voice`,
  features: (tenantId: string) => `/tenants/${tenantId}/features`,
  dashboard: () => '/dashboard',
  dashboardDomain: () => '/dashboard/domain',
  dashboardLook: () => '/dashboard/look',
  dashboardVoice: () => '/dashboard/voice',
  dashboardFeatures: () => '/dashboard/features',
  dashboardSelectTenant: () => '/dashboard/select-tenant',
  /** The picker's link target — verifies `tenantId` against the session's own `memberships` (or, for a SUPERADMIN, that the tenant exists) before setting the "active tenant" cookie. */
  dashboardSelectTenantHref: (tenantId: string) =>
    `/api/dashboard/select-tenant?tenantId=${tenantId}`,
} as const;
