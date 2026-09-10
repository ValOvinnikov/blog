import { service, type TLandingPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared page loader every self-fetching part of `/{slug}` reads. */
export const getLandingPage = cache(
  async (
    slug: string,
    tenant: string,
  ): Promise<TResult<TLandingPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.landing.v1.getPage(slug, tenantContext);
  },
);
