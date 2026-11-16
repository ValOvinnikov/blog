import { getTopics } from '@shinefold/service/features/entities/topics/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTopicsService() {
  return {
    v1: {
      getTopics: safeAsync((tenant: TTenantSanityContext) => getTopics(tenant)),
    },
  };
}
