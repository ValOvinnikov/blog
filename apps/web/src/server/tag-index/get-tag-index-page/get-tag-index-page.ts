import { service, type TTagIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getTagIndexPage = cache(
  async (): Promise<TResult<TTagIndexPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.tagIndex.v1.getIndexPage(sanityContext);
  },
);
