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
 * Resolves tenant Sanity credentials for the routes `proxy.ts`'s matcher
 * excludes (any URL containing a dot — `sitemap.xml`, `rss.xml`, the
 * favicon, and the default OG/Twitter images) and which therefore never
 * receive the `x-tenant-id` header `getTenantSanityContext` reads.
 * `isResolvable: false` means production saw a host matching no servable
 * tenant — unmatched, archived, or still mid-provisioning — the caller must
 * render as though it has no content, never fall back to the platform's own
 * project. Outside production, an unresolved host resolves `tenant` to
 * `getPlatformSanityContext()` — the deliberate single-tenant dev/preview
 * fallback. A matched tenant whose credentials query still comes back
 * empty — a race against `resolveRequestTenant()`'s own servability check,
 * in practice — resolves the same way: `isResolvable: false` in production,
 * the platform fallback outside it.
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
