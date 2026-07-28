import { getPage } from '@blog/service/features/pages/generic/adaptor/detail-page/loader';
import { getPageSlugs } from '@blog/service/features/pages/generic/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

export function createGenericPageService() {
  return {
    v1: {
      getPage: safeAsync((slug: string) => getPage(slug)),
      getPageSlugs: safeAsync(() => getPageSlugs()),
    },
  };
}
