import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { indexPageParamsQuery } from './query';
import type { TIndexPagePagination } from './types';

export async function getIndexPagePagination(
  tenant: TTenantSanityContext,
): Promise<TIndexPagePagination> {
  return runQuery(indexPageParamsQuery, {
    tenant,
    ...isr(['posts', 'page_postIndex', 'template_postIndex'], tenant.projectId),
  });
}
