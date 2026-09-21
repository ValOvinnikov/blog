import { service, type TBlogIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared post-index loader every self-fetching part of `/blog` reads. */
export const getPostIndexPage = cache(
  async (tenant: string): Promise<TResult<TBlogIndexPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.blog.v1.getIndexPage(tenantContext);
  },
);
