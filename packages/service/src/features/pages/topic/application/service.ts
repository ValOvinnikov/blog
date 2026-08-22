import { getTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import { getTopicParams } from '@blog/service/features/pages/topic/adaptor/detail-page-params/loader';
import { getTopicPaginationParams } from '@blog/service/features/pages/topic/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

export function createTopicService() {
  return {
    v1: {
      getTopicPage: safeAsync((slug: string) => getTopicPage(slug)),
      getTopicParams: safeAsync(() => getTopicParams()),
      getTopicPaginationParams: safeAsync(() => getTopicPaginationParams()),
    },
  };
}
