import { getIndexPage } from '@blog/service/features/pages/topic-index/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTopicIndexService() {
  return {
    v1: { getIndexPage: safeAsync(() => getIndexPage()) },
  };
}
