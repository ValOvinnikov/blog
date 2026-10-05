import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { tagParamsQuery } from './query';

export async function getTagParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string }[]> {
  return runQuery(tagParamsQuery, {
    tenant,
    ...isr('page_tag', tenant.projectId),
  });
}
