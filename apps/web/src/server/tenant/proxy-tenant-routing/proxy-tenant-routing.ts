import type {
  TLocaleIsoCode,
  TMaybeNull,
  TMaybeUndefined,
} from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { readThroughProxyTenantCache } from '@web/server/tenant/proxy-tenant-cache/proxy-tenant-cache';
import {
  resolveServableHost,
  type TResolvedHost,
} from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { selectProxyTenantLiveLocales } from '@web/server/tenant/tenant-live-locales/tenant-live-locales';

export type TTenantRouting = {
  tenant: TTenant;
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
  isSecondaryHost: boolean;
};

// Next gives the proxy its own `unstable_cache`, which `revalidateTag` in a route handler never purges.
const resolveProxyHost = (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TResolvedHost>> =>
  readThroughProxyTenantCache(host, resolveServableHost);

export const resolveProxyTenant = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TTenant>> => (await resolveProxyHost(host))?.tenant;

export const resolveTenantRouting = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TTenantRouting>> => {
  const resolved = await resolveProxyHost(host);

  if (!resolved) {
    return undefined;
  }

  const { tenant, isOwnHost } = resolved;

  return {
    tenant,
    tenantId: tenant.id,
    defaultLocale: tenant.locale,
    liveLocales: await selectProxyTenantLiveLocales(tenant),
    isSecondaryHost: isOwnHost && host !== tenant.primaryDomain,
  };
};
