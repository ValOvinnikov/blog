import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { buildLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

import { translationMapQuery } from './query';
import { toTranslationMap } from './transformer';
import type { TTranslationMap } from './types';

export async function getTranslationMap(
  tenant: TTenantSanityContext,
): Promise<TTranslationMap> {
  const raw = await runQuery(translationMapQuery, {
    tenant,
    ...isr(
      ['translation.metadata', 'page_landing', 'homePage'],
      tenant.projectId,
    ),
  });
  return toTranslationMap(raw, buildLocaleParams(tenant).defaultLocale);
}
