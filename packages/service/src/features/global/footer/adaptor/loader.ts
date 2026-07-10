import { isr, runQuery } from '#/sanity/query';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

export async function getFooter(): Promise<TFooter> {
  const raw = await runQuery(footerQuery, isr('footer'));
  return toFooter(raw);
}
