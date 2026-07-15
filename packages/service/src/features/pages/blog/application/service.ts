import {
  getBlogPage,
  getBlogPageCount,
  type TGetBlogPageArgs,
} from '@blog/service/features/pages/blog/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createBlogService() {
  return {
    v1: {
      getBlogPage: (args?: TGetBlogPageArgs) => safeAsync(getBlogPage(args)),
      getBlogPageCount: () => safeAsync(getBlogPageCount()),
    },
  };
}
