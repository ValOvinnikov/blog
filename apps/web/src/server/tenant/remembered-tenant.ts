import { cache } from 'react';

import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

type TRememberedTenantStore = { tenant?: string };

/**
 * A `cache()`-scoped holder, not `headers()` — it survives only one render
 * pass but never opts a static route into dynamic rendering, unlike a
 * header read would inside a not-found boundary that runs after the route
 * has already prerendered.
 */
const getStore = cache((): TRememberedTenantStore => ({}));

/**
 * Refuses `UNRESOLVED_TENANT_PLACEHOLDER` at this, its one write site — same
 * chokepoint convention as `getRequestTenantId`/`resolveRequestTenant` — so
 * `getRememberedTenantId` can never hand it downstream as a real tenant id.
 */
export const rememberRequestTenantId = (tenant: string): void => {
  if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return;
  getStore().tenant = tenant;
};

export const getRememberedTenantId = (): string | undefined =>
  getStore().tenant;
