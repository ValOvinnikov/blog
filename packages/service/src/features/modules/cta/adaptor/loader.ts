import { isr, runQuery } from '@blog/service/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

// Both `actions` links and `content`'s inline links resolve to the same
// post/topic/page document types, so one ISR tag list covers both.
export async function getCta(id: string): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    ...isr([
      'modules:cta',
      `module:${id}`,
      'post',
      'topic',
      'page_generic',
      'page_blog',
    ]),
  });

  return toCtaModule(raw);
}
