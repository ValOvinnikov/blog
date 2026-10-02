import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isPlatformFallbackAllowed } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { cache } from 'react';

export type THostTenantSanityContext =
  | { isResolvable: true; tenant: TTenantSanityContext }
  | { isResolvable: false };

/**
 * For routes `proxy.ts` excludes (URLs containing a dot), which never get the
 * `x-tenant-id` header. `isResolvable: false` means production saw no servable
 * tenant for the host — the caller must render as though it has no content,
 * never fall back to the platform's own project.
 */
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
      tenant: TTenantSanityContext | undefined;
      tenantId: string | undefined;
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
        isActive: true,
      };
    }

    return {
      isResolvable: true,
      tenant: queries.tenants.toTenantSanityWriteCredentials(resolvedTenant),
      tenantId: resolvedTenant.id,
      isActive: isTenantActive(resolvedTenant),
    };
  },
);
