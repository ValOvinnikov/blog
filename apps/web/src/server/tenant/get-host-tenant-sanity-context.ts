import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenantId } from './resolve-tenant-id';

export type THostTenantSanityContext =
  | { isResolvable: true; tenant: TTenantSanityContext | undefined }
  | { isResolvable: false };

/**
 * Resolves tenant Sanity credentials straight from the request's `Host`
 * header, for the handful of routes `proxy.ts`'s matcher excludes (any URL
 * containing a dot — `sitemap.xml`, `rss.xml`, the favicon, and the default
 * OG/Twitter images) and which therefore never receive the `x-tenant-id`
 * header `getTenantSanityContext` reads. `isResolvable: false` means
 * production saw a host matching no tenant — the caller must render as
 * though it has no content, never fall back to the platform's own project.
 *
 * Wrapped in React's `cache()`, not `unstable_cache` — same reasoning as
 * `getTenantSanityContext`: the resolved token is request-scoped-only, and
 * the `cache()` dedupes the host lookup and credentials query within one
 * render pass.
 */
export const getHostTenantSanityContext = cache(
  async (): Promise<THostTenantSanityContext> => {
    const host = (await headers()).get('host');
    const tenantId = await resolveTenantId(host);

    if (!tenantId) {
      if (isProductionEnvironment()) {
        return { isResolvable: false };
      }
      return { isResolvable: true, tenant: undefined };
    }

    const tenant = await queries.tenants.getTenantSanityCredentials(tenantId);
    return { isResolvable: true, tenant };
  },
);
