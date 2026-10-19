/**
 * The final path segment both Studio routes share — also matched against
 * `useSelectedLayoutSegment()` by `ShellFrame` to switch `AdminShell`'s
 * content column into full-bleed mode.
 */
export const STUDIO_SEGMENT = 'studio';

export const SIGN_IN_PATH = '/api/auth/signin';

/**
 * Single source of truth for apps/platform's own URL construction — never build
 * these paths inline elsewhere.
 */
export const adminRoutes = {
  home: () => '/',
  // Always explicit: without it Auth.js returns to its callback-url cookie, which sign-out leaves on this page.
  signIn: (callbackUrl = '/') =>
    `${SIGN_IN_PATH}?${new URLSearchParams({ callbackUrl })}`,
  workspacePending: () => '/workspace-pending',
  tenants: (options?: { archived?: boolean }) =>
    options?.archived ? '/tenants?archived=1' : '/tenants',
  newTenant: () => '/tenants/new',
  findings: () => '/findings',
  releases: () => '/releases',
  tenantOverview: (tenantId: string) => `/tenants/${tenantId}`,
  tenantProvisioning: (tenantId: string) => `/tenants/${tenantId}/provisioning`,
  tenantDanger: (tenantId: string) => `/tenants/${tenantId}/danger`,
  tenantDomain: (tenantId: string) => `/tenants/${tenantId}/domain`,
  look: (tenantId: string) => `/tenants/${tenantId}/look`,
  voice: (tenantId: string) => `/tenants/${tenantId}/voice`,
  features: (tenantId: string) => `/tenants/${tenantId}/features`,
  languages: (tenantId: string) => `/tenants/${tenantId}/languages`,
  email: (tenantId: string) => `/tenants/${tenantId}/email`,
  leads: (tenantId: string, page = 1) =>
    page > 1
      ? `/tenants/${tenantId}/leads?page=${page}`
      : `/tenants/${tenantId}/leads`,
  tenantStudio: (tenantId: string) => `/tenants/${tenantId}/${STUDIO_SEGMENT}`,
  dashboard: () => '/dashboard',
  dashboardDomain: () => '/dashboard/domain',
  dashboardLook: () => '/dashboard/look',
  dashboardVoice: () => '/dashboard/voice',
  dashboardFeatures: () => '/dashboard/features',
  dashboardLanguages: () => '/dashboard/languages',
  dashboardEmail: () => '/dashboard/email',
  dashboardLeads: (page = 1) =>
    page > 1 ? `/dashboard/leads?page=${page}` : '/dashboard/leads',
  dashboardStudio: () => `/dashboard/${STUDIO_SEGMENT}`,
  dashboardSelectTenant: () => '/dashboard/select-tenant',
  dashboardSelectTenantHref: (tenantId: string) =>
    `/api/dashboard/select-tenant?tenantId=${tenantId}`,
} as const;

export const tenantSiteUrl = (domain: string) => `https://${domain}`;
