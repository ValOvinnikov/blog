import { service, type TTagDetailPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTagPage = cache(
  async (slug: string): Promise<TResult<TTagDetailPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.tag.v1.getTagPage(slug, sanityContext);
  },
);
