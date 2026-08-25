import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { genericPageQuery } from './query';
import { toGenericPage } from './transformer';
import type { TGenericPage } from './types';

export async function getPage(
  slug: string,
): Promise<TMaybeUndefined<TGenericPage>> {
  const [raw, settings] = await Promise.all([
    runQuery(genericPageQuery, {
      parameters: { slug },
      ...isr('page_generic'),
    }),
    getSiteSettings(),
  ]);
  if (!raw) return undefined;

  return toGenericPage(raw, settings);
}
