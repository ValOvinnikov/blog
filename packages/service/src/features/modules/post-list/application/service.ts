import { safeAsync } from '@blog/utils';

import { getPostList } from '../adaptor/loader';

export function createPostListModuleService() {
  return {
    v1: { getPostList: (id: string) => safeAsync(getPostList(id)) },
  };
}
