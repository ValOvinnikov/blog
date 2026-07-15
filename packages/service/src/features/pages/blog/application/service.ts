import {
  getIndexPage,
  type TGetIndexPageArgs,
} from '@blog/service/features/pages/blog/adaptor/index-page/loader';
import { getIndexPageParams } from '@blog/service/features/pages/blog/adaptor/index-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createBlogService() {
  return {
    v1: {
      getIndexPage: (args?: TGetIndexPageArgs) => safeAsync(getIndexPage(args)),
      getIndexPageParams: () => safeAsync(getIndexPageParams()),
    },
  };
}
