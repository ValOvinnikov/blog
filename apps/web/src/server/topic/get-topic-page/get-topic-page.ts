import { service, type TTopicDetailPage } from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTopicPage = cache(
  async (slug: string): Promise<TResult<TTopicDetailPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.topic.v1.getTopicPage(slug, sanityContext);
  },
);
