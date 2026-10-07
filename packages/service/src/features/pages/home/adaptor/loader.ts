import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { buildLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePageDocument } from './types';

export async function getHomePageDocument(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePageDocument>> {
  const raw = await runQuery(homePageQuery, {
    tenant,
    ...isr(['homePage', 'template_home'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toHomePage(raw, buildLocaleQueryParams(tenant).defaultLocale);
}
