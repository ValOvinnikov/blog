import { service, type TBlogIndexPage } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getPostIndexPage = cache(
  async (): Promise<TResult<TBlogIndexPage | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.blog.v1.getIndexPage(sanityContext);
  },
);
