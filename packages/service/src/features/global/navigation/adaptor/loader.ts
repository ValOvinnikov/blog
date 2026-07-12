import { isr, runQuery } from '@blog/service/sanity/query';

import { navigationQuery } from './query';
import { toNavigation } from './transformer';
import type { TNavigation } from './types';

export async function getNavigation(): Promise<TNavigation> {
  const raw = await runQuery(navigationQuery, isr('navigation'));
  return toNavigation(raw);
}
