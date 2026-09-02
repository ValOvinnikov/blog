import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { cache } from 'react';

import { resolveRequestTenant } from './resolve-request-tenant';

export type THostTenantSanityContext =
  | { isResolvable: true; tenant: TTenantSanityContext | undefined }
  | { isResolvable: false };

/**
 * Resolves tenant Sanity credentials for the routes `proxy.ts`'s matcher
 * excludes (any URL containing a dot — `sitemap.xml`, `rss.xml`, the
 * favicon, and the default OG/Twitter images) and which therefore never
 * receive the `x-tenant-id` header `getTenantSanityContext` reads.
 * `isResolvable: false` means production saw a host matching no tenant — the
 * caller must render as though it has no content, never fall back to the
 * platform's own project.
 */
export const getHostTenantSanityContext = cache(
  async (): Promise<THostTenantSanityContext> => {
    const resolvedTenant = await resolveRequestTenant();

    if (!resolvedTenant) {
      if (isProductionEnvironment()) {
        return { isResolvable: false };
      }
      return { isResolvable: true, tenant: undefined };
    }

    const tenant = await queries.tenants.getTenantSanityCredentials(
      resolvedTenant.id,
    );
    return { isResolvable: true, tenant };
  },
);
