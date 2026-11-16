import type { TMaybeUndefined } from '@shinefold/config';
import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { buildLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

import { topicIndexPageQuery } from './query';
import { toTopicIndexPage } from './transformer';
import type { TTopicIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicIndexPage>> {
  const rawPage = await runQuery(topicIndexPageQuery, {
    tenant,
    ...isr(
      ['page_topicIndex', 'template_topicIndex', 'modules:taxonomyList'],
      tenant.projectId,
    ),
  });
  if (!rawPage) return undefined;

  return toTopicIndexPage(
    rawPage,
    buildLocaleQueryParams(tenant).defaultLocale,
  );
}
