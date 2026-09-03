import { getTags } from '@blog/service/features/entities/tags/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTagsService() {
  return {
    v1: {
      getTags: safeAsync((tenant: TTenantSanityContext) => getTags(tenant)),
    },
  };
}
