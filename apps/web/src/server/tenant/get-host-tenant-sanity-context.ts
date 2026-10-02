import { queries } from '@blog/db';
import {
  getPlatformSanityContext,
  type TTenantSanityContext,
} from '@blog/service';
import { cache } from 'react';

import { isPlatformFallbackAllowed } from './is-platform-fallback-allowed';
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
