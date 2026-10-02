import { service, type TTopicIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTopicIndexPage = cache(
  async (): Promise<TResult<TTopicIndexPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.topicIndex.v1.getIndexPage(sanityContext);
  },
);
