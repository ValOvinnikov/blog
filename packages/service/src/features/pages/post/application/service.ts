import { getPost } from '@blog/service/features/pages/post/adaptor/detail/loader';
import { getPostParams } from '@blog/service/features/pages/post/adaptor/params/loader';

export function createPostService() {
  return {
    v1: { getPost, getPostParams },
  };
}
