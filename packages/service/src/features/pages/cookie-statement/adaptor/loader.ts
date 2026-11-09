import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';
import { buildLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import { cookieStatementPageQuery } from './query';
import { toCookieStatementPage } from './transformer';
import type { TCookieStatementPage } from './types';

export async function getCookieStatementPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TCookieStatementPage>> {
  const raw = await runQuery(cookieStatementPageQuery, {
    tenant,
    ...isr(['topic', ...LINK_TARGET_CACHE_TAGS], tenant.projectId),
  });
  if (!raw) return undefined;

  return toCookieStatementPage(
    raw,
    buildLocaleQueryParams(tenant).defaultLocale,
  );
}
