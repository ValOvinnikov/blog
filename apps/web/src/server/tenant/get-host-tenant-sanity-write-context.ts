import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { cache } from 'react';

import { isPlatformFallbackAllowed } from './is-platform-fallback-allowed';
import { isTenantActive } from './is-tenant-active';
import { resolveRequestTenant } from './resolve-request-tenant';

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
