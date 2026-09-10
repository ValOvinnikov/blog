import { service, type TTopicDetailPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared topic-page loader every self-fetching part of `/topics/[slug]` reads. */
export const getTopicPage = cache(
  async (
    slug: string,
    tenant: string,
  ): Promise<TResult<TTopicDetailPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.topic.v1.getTopicPage(slug, tenantContext);
  },
);
