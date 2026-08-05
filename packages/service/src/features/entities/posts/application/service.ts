import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createPostsService() {
  return {
    v1: { getPostsByIds: safeAsync((ids: string[]) => getPostsByIds(ids)) },
  };
}
