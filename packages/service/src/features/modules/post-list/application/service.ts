import { getPostList } from '@blog/service/features/modules/post-list/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createPostListModuleService() {
  return {
    v1: { getPostList: (id: string) => safeAsync(getPostList(id)) },
  };
}
