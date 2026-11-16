import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

import { tagPaginationParamsQuery } from './query';
import type { TTagPaginatedPage } from './types';

export async function getTagPaginatedPages(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TTagPaginatedPage[]> {
  return runQuery(tagPaginationParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr(['page_tag', 'template_tag', 'posts', 'tag'], tenant.projectId),
  });
}
