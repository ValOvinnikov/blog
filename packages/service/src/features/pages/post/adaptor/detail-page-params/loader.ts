import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { postParamsQuery } from './query';

export async function getPostParams(
  tenant?: TTenantSanityContext,
): Promise<{ slug: string; publishedAt: string }[]> {
  return runQuery(postParamsQuery, {
    tenant,
    ...isr('page_post', tenant?.projectId),
  });
}
