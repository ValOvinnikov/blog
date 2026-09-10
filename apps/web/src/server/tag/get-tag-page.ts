import { service, type TTagDetailPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared tag-page loader every self-fetching part of `/tags/[slug]` reads. */
export const getTagPage = cache(
  async (
    slug: string,
    tenant: string,
  ): Promise<TResult<TTagDetailPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.tag.v1.getTagPage(slug, tenantContext);
  },
);
