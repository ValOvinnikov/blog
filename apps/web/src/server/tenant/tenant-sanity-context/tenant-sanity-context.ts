import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@shinefold/service';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isPlatformFallbackAllowed } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { cache } from 'react';

export type THostTenantSanityContext =
  | { isResolvable: true; tenant: TTenantSanityContext }
  | { isResolvable: false };

/** For routes `proxy.ts` excludes, which never get `x-tenant-id`; when unresolvable, render no content rather than the platform's own project. */
export const getHostTenantSanityContext = cache(
  async (): Promise<THostTenantSanityContext> => {
    const resolvedTenant = await resolveRequestTenant();
    const tenant =
      resolvedTenant &&
      queries.tenants.toTenantSanityCredentials(resolvedTenant);
    if (tenant) {
      return { isResolvable: true, tenant };
    }

    if (!isPlatformFallbackAllowed()) {
      return { isResolvable: false };
    }
    return { isResolvable: true, tenant: getPlatformSanityContext() };
  },
);

export type TTenantSanityWriteContext = {
  tenant: TMaybeUndefined<TTenantSanityContext>;
  tenantId: TMaybeUndefined<string>;
  isActive: boolean;
};

export type THostTenantSanityWriteContext =
  | ({ isResolvable: true } & TTenantSanityWriteContext)
  | { isResolvable: false };

export const toTenantSanityWriteContext = (
  tenant: TTenant,
): TTenantSanityWriteContext => ({
  tenant: queries.tenants.toTenantSanityWriteCredentials(tenant),
  tenantId: tenant.id,
  isActive: isTenantActive(tenant),
});

export const getHostTenantSanityWriteContext = cache(
  async (): Promise<THostTenantSanityWriteContext> => {
    const resolvedTenant = await resolveRequestTenant();

    if (!resolvedTenant) {
      if (!isPlatformFallbackAllowed()) {
        return { isResolvable: false };
      }
      return {
        isResolvable: true,
        tenant: undefined,
        tenantId: undefined,
        isActive: true,
      };
    }

    return {
      isResolvable: true,
      ...toTenantSanityWriteContext(resolvedTenant),
    };
  },
);
