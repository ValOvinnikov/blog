import { resolveTenant } from './resolve-tenant';

/**
 * resolveTenantId — thin `resolveTenant()` wrapper for callers (`proxy.ts`,
 * write-credential/API routes) that only need the id, never the rest of the
 * row. Every caller refuses to serve when it resolves to `undefined` —
 * `proxy.ts` 404s, `getHostTenantSanityContext`/
 * `getHostTenantSanityWriteContext` report `isResolvable: false` — rather
 * than ever substituting another tenant's data for it; `getClient`/
 * `getWriteClient` requiring a `TTenantSanityContext` argument makes it
 * impossible to reach a `service.*` call without one.
 */
export const resolveTenantId = async (
  host: string | null,
): Promise<string | undefined> => {
  const tenant = await resolveTenant(host);
  return tenant?.id;
};
