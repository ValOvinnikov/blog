import { getBlogPage } from '../adaptor/loader';

export function createBlogService() {
  return {
    v1: { getBlogPage },
  };
}
