import type { TMaybeUndefined } from '@shinefold/config';
import {
  service,
  type TSectionIndexPage,
  type TSectionIndexType,
} from '@shinefold/service';
import type { TResult } from '@shinefold/utils';
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
