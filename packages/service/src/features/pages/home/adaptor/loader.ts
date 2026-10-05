import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { buildLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const raw = await runQuery(homePageQuery, {
    tenant,
    ...isr(['homePage', 'modules:faq', 'block_faq'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toHomePage(raw, buildLocaleParams(tenant).defaultLocale);
}
