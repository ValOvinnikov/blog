import { service, type TTagDetailPage } from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTagPage = cache(
  async (slug: string): Promise<TResult<TTagDetailPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.tag.v1.getTagPage(slug, sanityContext);
  },
);
