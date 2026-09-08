import { service, type TTopicIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { cache } from 'react';

/** The shared topic-index loader every self-fetching part of `/topics` reads. */
export const getTopicsIndexPage = cache(
  async (tenant: string): Promise<TResult<TTopicIndexPage | undefined>> => {
    const tenantContext = await getTenantSanityContext(tenant);
    return service.pages.topicIndex.v1.getIndexPage(tenantContext);
  },
);
