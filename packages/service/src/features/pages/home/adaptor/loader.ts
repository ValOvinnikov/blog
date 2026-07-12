import { isr, runQuery } from '@blog/service/sanity/query';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(): Promise<THomePage> {
  const raw = await runQuery(homePageQuery, isr('homePage'));

  return toHomePage(raw);
}
