import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { pageTitleQuery } from './query';

export async function getPageTitle(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> {
  const raw = await runQuery(pageTitleQuery, {
    tenant,
    parameters: { id },
    ...isr(['homePage', 'page_landing'], tenant.projectId),
  });
  if (!raw) return undefined;

  return raw.title;
}
