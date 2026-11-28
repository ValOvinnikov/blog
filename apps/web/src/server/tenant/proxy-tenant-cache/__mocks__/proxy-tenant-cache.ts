import type * as TModule from '@web/server/tenant/proxy-tenant-cache/proxy-tenant-cache';

export const readThroughProxyTenantCache = vi.fn<
  typeof TModule.readThroughProxyTenantCache
>(async (host, resolve) => resolve(host));

export const expireProxyTenantCache = vi.fn<
  typeof TModule.expireProxyTenantCache
>(async () => undefined);
