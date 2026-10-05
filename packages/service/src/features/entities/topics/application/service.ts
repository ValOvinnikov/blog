import { getTopics } from '@blog/service/features/entities/topics/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createTopicsService() {
  return {
    v1: {
      getTopics: safeAsync((tenant: TTenantSanityContext) => getTopics(tenant)),
    },
  };
}
