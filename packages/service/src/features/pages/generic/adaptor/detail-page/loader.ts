import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { genericPageQuery } from './query';
import { toGenericPage } from './transformer';
import type { TGenericPage } from './types';

export async function getPage(
  slug: string,
): Promise<TMaybeUndefined<TGenericPage>> {
  const raw = await runQuery(genericPageQuery, {
    parameters: { slug },
    ...isr('page_generic'),
  });
  if (!raw) return undefined;

  const settings = await getSiteSettings();
  return toGenericPage(raw, settings);
}
