import { isr, runQuery } from '#/sanity/query';

import { genericPageQuery } from './query';
import { toGenericPage } from './transformer';
import type { TGenericPage } from './types';

export async function getPage(slug: string): Promise<TGenericPage> {
  const raw = await runQuery(genericPageQuery, {
    parameters: { slug },
    ...isr('page_generic'),
  });

  return toGenericPage(raw);
}
