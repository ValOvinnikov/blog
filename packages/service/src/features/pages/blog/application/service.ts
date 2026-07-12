import { getBlogPage } from '@blog/service/features/pages/blog/adaptor/loader';

export function createBlogService() {
  return {
    v1: { getBlogPage },
  };
}
