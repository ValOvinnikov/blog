import type { TLocaleIsoCode } from '@blog/config';
import { queries, TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

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

const resolveSoleTenant = async (): Promise<TTenant | undefined> => {
  const tenants = await queries.tenants.listTenants();
  if (tenants.length !== 1) return undefined;

  const [tenant] = tenants;
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

export const resolveTenant = async (
  host: string | null,
): Promise<TTenant | undefined> => {
  const tenant = host
    ? await queries.tenantDomains.getTenantByDomain(host)
    : undefined;
  if (tenant) {
    return isTenantServable(tenant) ? tenant : undefined;
  }

  if (!isPlatformFallbackAllowed()) return undefined;

  return resolveSoleTenant();
};

export const resolveTenantById = async (
  tenantId: string,
): Promise<TTenant | undefined> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant && isTenantServable(tenant) ? tenant : undefined;
};

export const resolveTenantId = async (
  host: string | null,
): Promise<string | undefined> => {
  const tenant = await resolveTenant(host);
  return tenant?.id;
};

export const resolveTenantRouting = async (
  host: string | null,
): Promise<TTenantRouting | undefined> => {
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
