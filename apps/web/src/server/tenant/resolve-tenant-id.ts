import { resolveTenant } from './resolve-tenant';

/**
 * resolveTenantId — thin `resolveTenant()` wrapper for callers (`proxy.ts`,
 * write-credential/API routes) that only need the id, never the rest of the
 * row.
 */
export const resolveTenantId = async (
  host: string | null,
): Promise<string | undefined> => {
  const tenant = await resolveTenant(host);
  return tenant?.id;
};
