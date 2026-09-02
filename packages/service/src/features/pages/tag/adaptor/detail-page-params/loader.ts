import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagParamsQuery } from './query';

export async function getTagParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string }[]> {
  return runQuery(tagParamsQuery, {
    tenant,
    ...isr('page_tag', tenant.projectId),
  });
}
