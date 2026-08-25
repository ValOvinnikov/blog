import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createPostService() {
  return {
    v1: {
      getPost: safeAsync((slug: string) => getPost(slug)),
      getPostParams: safeAsync(() => getPostParams()),
    },
  };
}
