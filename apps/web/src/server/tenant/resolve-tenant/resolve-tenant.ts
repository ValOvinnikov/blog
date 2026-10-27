import {
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TLocaleIsoCode,
  type TMaybeJsonDates,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@blog/config';
import { queries, TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { reviveCachedTenant } from '@web/server/tenant/revive-cached-tenant/revive-cached-tenant';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { TENANT_BY_HOST_CACHE_TAG } from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';

export type TTenantRouting = {
  tenant: TTenant;
  tenantId: string;
  defaultLocale: TLocaleIsoCode;
  liveLocales: TLocaleIsoCode[];
};

export const isPlatformFallbackAllowed = (): boolean =>
  !isProductionEnvironment();

/** Only production requires READY: local/dev rows predate `provisioningStatus`. */
export const isTenantServable = (tenant: TTenant): boolean => {
  const hasCredentials =
    tenant.status !== TENANT_STATUS.ARCHIVED &&
    Boolean(tenant.sanityProjectId) &&
    Boolean(tenant.sanityDataset) &&
    Boolean(tenant.sanityReadTokenEncrypted);

  if (!hasCredentials) return false;

  if (!isProductionEnvironment()) return true;

  return tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY;
};

const resolveSoleTenant = async (): Promise<TMaybeUndefined<TTenant>> => {
  const tenants = await queries.tenants.listTenants();
  if (tenants.length !== 1) return undefined;

  const [tenant] = tenants;
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

const resolveUncachedTenant = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TTenant>> => {
  const tenant = host
    ? await queries.tenantDomains.getTenantByDomain(host)
    : undefined;
  if (tenant) {
    return isTenantServable(tenant) ? tenant : undefined;
  }

  if (!isPlatformFallbackAllowed()) return undefined;

  return resolveSoleTenant();
};

class UnresolvedHostError extends Error {}

const resolveServableTenantOrThrow = async (
  host: TMaybeNull<string>,
): Promise<TMaybeJsonDates<TTenant>> => {
  const tenant = await resolveUncachedTenant(host);
  if (!tenant) throw new UnresolvedHostError();
  return tenant;
};

// A miss throws so `unstable_cache` never stores it: a host visited before its tenant is READY resolves the moment it is.
const getCachedTenantByHost = unstable_cache(
  resolveServableTenantOrThrow,
  [TENANT_BY_HOST_CACHE_TAG],
  {
    tags: [TENANT_BY_HOST_CACHE_TAG],
    revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
  },
);

export const resolveTenant = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TTenant>> => {
  try {
    return reviveCachedTenant(await getCachedTenantByHost(host));
  } catch (error) {
    if (error instanceof UnresolvedHostError) return undefined;
    throw error;
  }
};

export const resolveTenantById = async (
  tenantId: string,
): Promise<TMaybeUndefined<TTenant>> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

export const resolveTenantId = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<string>> => {
  const tenant = await resolveTenant(host);
  return tenant?.id;
};

export const resolveTenantRouting = async (
  host: TMaybeNull<string>,
): Promise<TMaybeUndefined<TTenantRouting>> => {
  const tenant = await resolveTenant(host);

  if (!tenant) {
    return undefined;
  }

  return {
    tenant,
    tenantId: tenant.id,
    defaultLocale: tenant.locale,
    liveLocales: queries.tenants.selectLiveLocales(tenant),
  };
};
