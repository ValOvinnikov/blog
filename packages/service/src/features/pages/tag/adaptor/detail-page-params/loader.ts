import type { TLocaleIsoCode } from '@blog/config/constants';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { tagParamsQuery } from './query';

export async function getTagParams(
  tenant: TTenantSanityContext,
  liveLocales: TLocaleIsoCode[],
): Promise<{ slug: string; language: TLocaleIsoCode }[]> {
  return runQuery(tagParamsQuery, {
    parameters: { liveLocales },
    tenant,
    ...isr('page_tag', tenant.projectId),
  });
}
