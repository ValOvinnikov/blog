import { isr, runQuery } from '@blog/service/sanity/query';

import { newsletterModuleQuery } from './query';
import { toNewsletterModule } from './transformer';
import type { TNewsletterModule } from './types';

export async function getNewsletter(id: string): Promise<TNewsletterModule> {
  const raw = await runQuery(newsletterModuleQuery, {
    parameters: { id },
    ...isr(['modules:newsletter', `module:${id}`]),
  });

  return toNewsletterModule(raw);
}
