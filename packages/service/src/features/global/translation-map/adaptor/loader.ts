import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { buildLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import { translationMapQuery } from './query';
import { toTranslationMap } from './transformer';
import type { TTranslationMap } from './types';

export async function getTranslationMap(
  tenant: TTenantSanityContext,
): Promise<TTranslationMap> {
  const raw = await runQuery(translationMapQuery, {
    tenant,
    ...isr(
      [
        'translation.metadata',
        'page_landing',
        'page_post',
        'page_topic',
        'page_tag',
        'homePage',
        'page_postIndex',
        'page_topicIndex',
        'page_tagIndex',
      ],
      tenant.projectId,
    ),
  });
  return toTranslationMap(raw, buildLocaleQueryParams(tenant).defaultLocale);
}
