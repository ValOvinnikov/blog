import { isr, runQuery } from '#/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

export async function getCta(id: string): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    ...isr(['modules:cta', `module:${id}`]),
  });

  return toCtaModule(raw);
}
