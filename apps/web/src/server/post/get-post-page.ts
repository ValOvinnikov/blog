import { service, type TPostDetail } from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getPostPage = cache(
  async (slug: string): Promise<TResult<TPostDetail | undefined>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.post.v1.getPost(slug, sanityContext);
  },
);
