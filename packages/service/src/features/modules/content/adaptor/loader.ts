import { isr, runQuery } from '@blog/service/sanity/query';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

export async function getContent(id: string): Promise<TContentModule> {
  const raw = await runQuery(contentModuleQuery, {
    parameters: { id },
    ...isr(['modules:content', `module:${id}`]),
  });

  return toContentModule(raw);
}
