import { isr, runQuery } from '@blog/service/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

// `ctaModuleQuery` derefs `internalReference` in two places — `actions`
// (via `actionGroupFragment` → `linkFragment`) and `content`'s inline `link`
// annotations (via the same fragment, spread into each block's `markDefs`
// projection) — both resolving to the same `blog_post`/`blog_topic`/
// `page_generic`/`page_blog` union, so one tag list covers both
// (tag-scope contract, `sanity/query.ts`).
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
