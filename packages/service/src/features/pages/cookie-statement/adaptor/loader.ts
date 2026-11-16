import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';
import { buildLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

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
