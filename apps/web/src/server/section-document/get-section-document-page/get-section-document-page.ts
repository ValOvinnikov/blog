import type { TMaybeUndefined } from '@blog/config';
import {
  service,
  type TSectionDocumentDetail,
  type TSectionDocumentType,
} from '@blog/service';
import type { TResult } from '@blog/utils';
import { getRequestContext } from '@web/server/request-context/request-context';
import { cache } from 'react';

export const getSectionDocumentPage = cache(
  async (
    type: TSectionDocumentType,
    slug: string,
  ): Promise<TResult<TMaybeUndefined<TSectionDocumentDetail>>> => {
    const { sanityContext } = await getRequestContext();
    return service.pages.sectionDocument.v1.getSectionDocument(
      type,
      slug,
      sanityContext,
    );
  },
);
