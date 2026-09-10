import { service, type TTagIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared tag-index loader every self-fetching part of `/tags` reads. */
export const getTagsIndexPage = cache(
  async (tenant: string): Promise<TResult<TTagIndexPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.tagIndex.v1.getIndexPage(tenantContext);
  },
);
