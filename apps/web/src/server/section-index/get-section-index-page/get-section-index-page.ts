import type { TMaybeUndefined } from '@blog/config';
import {
  service,
  type TSectionIndexPage,
  type TSectionIndexType,
} from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getSectionIndexPage = cache(
  async (
    type: TSectionIndexType,
  ): Promise<TResult<TMaybeUndefined<TSectionIndexPage>>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.sectionIndex.v1.getSectionIndexPage(
      type,
      sanityContext,
    );
  },
);
