import { safeAsync } from '@blog/utils';

import { getPostRelated } from './get-post-related';

export function createPostRelatedModuleService() {
  return {
    v1: {
      getPostRelated: safeAsync(getPostRelated),
    },
  };
}
