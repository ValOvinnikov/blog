import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
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

export type THostTenantSanityWriteContext =
  | {
      isResolvable: true;
      tenant: TMaybeUndefined<TTenantSanityContext>;
      tenantId: TMaybeUndefined<string>;
      plan: TMaybeUndefined<TTenantPlan>;
      isActive: boolean;
    }
  | { isResolvable: false };

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
        plan: undefined,
        isActive: true,
      };
    }

    return {
      isResolvable: true,
      tenant: queries.tenants.toTenantSanityWriteCredentials(resolvedTenant),
      tenantId: resolvedTenant.id,
      plan: resolvedTenant.plan,
      isActive: isTenantActive(resolvedTenant),
    };
  },
);
