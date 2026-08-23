import { getIndexPage } from '@blog/service/features/pages/tag-index/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTagIndexService() {
  return {
    v1: { getIndexPage: safeAsync(() => getIndexPage()) },
  };
}
