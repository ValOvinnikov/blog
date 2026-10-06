import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { buildLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

import { tagIndexPageQuery } from './query';
import { toTagIndexPage } from './transformer';
import type { TTagIndexPage } from './types';

export async function getIndexPage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagIndexPage>> {
  const rawPage = await runQuery(tagIndexPageQuery, {
    tenant,
    ...isr(
      ['page_tagIndex', 'template_tagIndex', 'modules:taxonomyList'],
      tenant.projectId,
    ),
  });
  if (!rawPage) return undefined;

  return toTagIndexPage(rawPage, buildLocaleParams(tenant).defaultLocale);
}
