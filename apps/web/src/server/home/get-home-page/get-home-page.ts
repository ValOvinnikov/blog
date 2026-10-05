import { service, type THomePage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getHomePage = cache(
  async (): Promise<TResult<THomePage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.home.v1.getHomePage(sanityContext);
  },
);
