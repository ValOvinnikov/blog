import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { isProductionEnvironment } from '@web/utils/is-production-environment';
import { headers } from 'next/headers';
import { cache } from 'react';

import { resolveTenantId } from './resolve-tenant-id';

export type THostTenantSanityWriteContext =
  | {
      isResolvable: true;
      tenant: TTenantSanityContext | undefined;
      tenantId: string | undefined;
    }
  | { isResolvable: false };

/**
 * Write-credential counterpart to `getHostTenantSanityContext` — same host
 * resolution and `cache()` scoping, but resolving the tenant's Sanity
 * *write* credentials for routes (like `/api/generate-skim`) that must read
 * and write within one tenant project. `isResolvable: false` means
 * production saw a host matching no tenant — the caller must refuse the
 * write, never fall back to the platform's project.
 *
 * Unlike the read counterpart, this also returns `tenantId` alongside
 * `tenant`: the write side must distinguish "no tenant resolved" (platform
 * mode — `tenant: undefined, tenantId: undefined`, safe to use the platform
 * write client) from "a tenant resolved but has no usable write credentials"
 * (`tenant: undefined, tenantId: string` — must fail loudly, never fall back
 * to the platform's project).
 */
export const getHostTenantSanityWriteContext = cache(
  async (): Promise<THostTenantSanityWriteContext> => {
    const host = (await headers()).get('host');
    const tenantId = await resolveTenantId(host);

    if (!tenantId) {
      if (isProductionEnvironment()) {
        return { isResolvable: false };
      }
      return { isResolvable: true, tenant: undefined, tenantId: undefined };
    }

    const tenant =
      await queries.tenants.getTenantSanityWriteCredentials(tenantId);
    return { isResolvable: true, tenant, tenantId };
  },
);
