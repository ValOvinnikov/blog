import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createPostService() {
  return {
    v1: {
      // `getPost` throws `MissingPagePostError` when no `page_post` matches
      // the slug — safeAsync turns that (and any other query failure) into
      // a clean `ok: false` instead of an uncaught crash.
      getPost: safeAsync((slug: string) => getPost(slug)),
      getPostParams: safeAsync(() => getPostParams()),
    },
  };
}
