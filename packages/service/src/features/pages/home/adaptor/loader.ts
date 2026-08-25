import type { TMaybeUndefined } from '@blog/config';
import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(): Promise<TMaybeUndefined<THomePage>> {
  const [raw, settings] = await Promise.all([
    runQuery(homePageQuery, isr('homePage')),
    getSiteSettings(),
  ]);
  if (!raw) return undefined;

  return toHomePage(raw, settings);
}
