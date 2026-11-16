import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';

import { pageTitleQuery } from './query';

export async function getPageTitle(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<string>> {
  const raw = await runQuery(pageTitleQuery, {
    tenant,
    parameters: { id },
    ...isr(
      [
        'homePage',
        'page_landing',
        'page_privacyIndex',
        'page_privacyDocument',
        'page_legalIndex',
        'page_legalDocument',
        'page_cookieStatement',
      ],
      tenant.projectId,
    ),
  });
  if (!raw) return undefined;

  return raw.title;
}
