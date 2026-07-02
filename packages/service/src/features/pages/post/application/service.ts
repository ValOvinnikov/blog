import { getPost } from '../adaptor/detail/loader';
import { getPostParams } from '../adaptor/params/loader';

export function createPostService() {
  return {
    v1: { getPost, getPostParams },
  };
}
