import { getTopicParams } from '@blog/service/features/pages/topic/adaptor/detail-page-params/loader';
import { safeAsync } from '@blog/utils';

import { getTopicPage } from './get-topic-page';
import { getTopicPaginationParams } from './get-topic-pagination-params';

export function createTopicService() {
  return {
    v1: {
      getTopicPage: safeAsync(getTopicPage),
      getTopicParams: safeAsync(getTopicParams),
      getTopicPaginationParams: safeAsync(getTopicPaginationParams),
    },
  };
}
