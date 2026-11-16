import { getTags } from '@shinefold/service/features/entities/tags/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTagsService() {
  return {
    v1: {
      getTags: safeAsync((tenant: TTenantSanityContext) => getTags(tenant)),
    },
  };
}
