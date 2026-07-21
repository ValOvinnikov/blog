import { getPage } from '@blog/service/features/pages/generic/adaptor/loader';
import { getPageSlugs } from '@blog/service/features/pages/generic/adaptor/params/loader';
import { safeAsync } from '@blog/utils';

export function createGenericPageService() {
  return {
    v1: {
      getPage: (slug: string) => safeAsync(getPage(slug)),
      getPageSlugs: () => safeAsync(getPageSlugs()),
    },
  };
}
