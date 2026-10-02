/**
 * Keeps the `[tenant]` segment non-empty so the route tree matches when no tenant resolves; every consumer refuses it rather than forwarding it as a tenant id.
 */
export const UNRESOLVED_TENANT_PLACEHOLDER = 'unresolved-tenant';
