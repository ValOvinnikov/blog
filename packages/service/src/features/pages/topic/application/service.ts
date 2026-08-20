import { getTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import { getTopicParams } from '@blog/service/features/pages/topic/adaptor/detail-page-params/loader';
import { getTopicPaginationParams } from '@blog/service/features/pages/topic/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

type TGetTopicPageArgs = Parameters<typeof getTopicPage>[1];

export function createTopicService() {
  return {
    v1: {
      // Loader still returns `TTopicPage | null` for "topic not
      // found"; safeAsync only wraps arbitrary query failures, so callers
      // check `.ok` first, then `.data !== null` (see #713).
      getTopicPage: safeAsync((slug: string, args: TGetTopicPageArgs) =>
        getTopicPage(slug, args),
      ),
      getTopicParams: safeAsync(() => getTopicParams()),
      getTopicPaginationParams: safeAsync((itemsPerPage: number) =>
        getTopicPaginationParams(itemsPerPage),
      ),
    },
  };
}
