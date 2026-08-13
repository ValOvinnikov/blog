/**
 * Single source of truth for apps/admin's own URL construction — never build
 * these paths inline elsewhere.
 */
export const adminRoutes = {
  tenants: () => '/tenants',
  tenant: (tenantSlug: string) => `/t/${tenantSlug}`,
} as const;
