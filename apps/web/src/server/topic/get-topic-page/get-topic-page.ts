import { service, type TTopicDetailPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTopicPage = cache(
  async (slug: string): Promise<TResult<TTopicDetailPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.topic.v1.getTopicPage(slug, sanityContext);
  },
);
