import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { buildLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

import { blogPageQuery } from './query';
import { toIndexPage } from './transformer';
import type { TBlogIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TBlogIndexPage>> {
  const rawPage = await runQuery(blogPageQuery, {
    tenant,
    ...isr(['page_postIndex', 'template_postIndex'], tenant.projectId),
  });
  if (!rawPage) return undefined;

  return toIndexPage(rawPage, buildLocaleQueryParams(tenant).defaultLocale);
}
