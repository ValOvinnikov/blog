import { getPost } from '@blog/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/detail-page-params/loader';

export function createPostService() {
  return {
    v1: { getPost, getPostParams },
  };
}
