/**
 * The `[tenant]` route segment `proxy.ts` writes when no tenant resolves for
 * the request (only possible outside production). It exists solely to keep
 * that segment non-empty so the route tree matches — `getRequestTenantId`
 * and `resolveRequestTenant` each refuse it at their own chokepoint rather
 * than forwarding it downstream as a real tenant id.
 */
export const UNRESOLVED_TENANT_PLACEHOLDER = 'unresolved-tenant';
