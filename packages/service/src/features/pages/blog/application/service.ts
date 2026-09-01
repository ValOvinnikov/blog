import { getIndexPage } from '@blog/service/features/pages/blog/adaptor/index-page/loader';
import { getIndexPageParams } from '@blog/service/features/pages/blog/adaptor/index-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createBlogService() {
  return {
    v1: {
      getIndexPage: safeAsync(() => getIndexPage()),
      getIndexPageParams: safeAsync(() => getIndexPageParams()),
    },
  };
}
