import { cache } from 'react';

type TRememberedTenantStore = { tenant?: string };

/**
 * A `cache()`-scoped holder, not `headers()` — it survives only one render
 * pass but never opts a static route into dynamic rendering, unlike a
 * header read would inside a not-found boundary that runs after the route
 * has already prerendered.
 */
const getStore = cache((): TRememberedTenantStore => ({}));

export const rememberRequestTenantId = (tenant: string): void => {
  getStore().tenant = tenant;
};

export const getRememberedTenantId = (): string | undefined =>
  getStore().tenant;
