import { service, type TLandingPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getLandingPage = cache(
  async (path: string): Promise<TResult<TLandingPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.landing.v1.getPage(path.split('/'), sanityContext);
  },
);
