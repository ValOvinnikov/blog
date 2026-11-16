import { service, type TLandingPage } from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getLandingPage = cache(
  async (path: string): Promise<TResult<TLandingPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.landing.v1.getPage(path.split('/'), sanityContext);
  },
);
