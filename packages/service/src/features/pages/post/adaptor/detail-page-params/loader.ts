import type { TLocaleIsoCode } from '@shinefold/config/constants';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

import { postParamsQuery } from './query';

export async function getPostParams(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<{ slug: string; language: TLocaleIsoCode; publishedAt: string }[]> {
  return runQuery(postParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr('page_post', tenant.projectId),
  });
}
