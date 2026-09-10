import { service, type TPostDetail } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared post loader every self-fetching part of `/blog/{slug}` reads. */
export const getPostPage = cache(
  async (
    slug: string,
    tenant: string,
  ): Promise<TResult<TPostDetail | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.post.v1.getPost(slug, tenantContext);
  },
);
