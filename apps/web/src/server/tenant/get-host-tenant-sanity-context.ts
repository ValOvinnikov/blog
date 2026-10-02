import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { cache } from 'react';

import { resolveRequestTenant } from './resolve-request-tenant';

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

    if (!resolvedTenant) {
      if (isProductionEnvironment()) {
        return { isResolvable: false };
      }
      return { isResolvable: true, tenant: getPlatformSanityContext() };
    }

    const tenant = await queries.tenants.getTenantSanityCredentials(
      resolvedTenant.id,
    );
    if (tenant) {
      return { isResolvable: true, tenant };
    }

    if (isProductionEnvironment()) {
      return { isResolvable: false };
    }
    return { isResolvable: true, tenant: getPlatformSanityContext() };
  },
);
