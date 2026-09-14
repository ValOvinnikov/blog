import { cache } from 'react';

import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

type TRememberedTenantStore = { tenant?: string };

/** Per-request storage a not-found boundary can read without a `headers()` call. */
const getStore = cache((): TRememberedTenantStore => ({}));

/** Never remembers `UNRESOLVED_TENANT_PLACEHOLDER` as a real tenant id. */
export const rememberRequestTenantId = (tenant: string): void => {
  if (tenant === UNRESOLVED_TENANT_PLACEHOLDER) return;
  getStore().tenant = tenant;
};

export const getRememberedTenantId = (): string | undefined =>
  getStore().tenant;
