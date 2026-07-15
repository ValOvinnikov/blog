import { getSiteSettings } from '@blog/service/features/global/site-settings/adaptor/loader';
import { isr, runQuery } from '@blog/service/sanity/query';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(): Promise<THomePage> {
  const [raw, settings] = await Promise.all([
    runQuery(homePageQuery, isr('homePage')),
    getSiteSettings(),
  ]);

  return toHomePage(raw, settings);
}
