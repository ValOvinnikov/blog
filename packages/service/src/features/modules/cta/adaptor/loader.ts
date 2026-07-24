import { isr, runQuery } from '@blog/service/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

// `ctaModuleQuery` projects `action` through `linkFragment`, whose
// `internalReference` can resolve to `blog_post`/`blog_category`/
// `page_generic`/`page_blog` — every one of those types' tags must be
// included (tag-scope contract, `sanity/query.ts`).
export async function getCta(id: string): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    ...isr([
      'modules:cta',
      `module:${id}`,
      'post',
      'category',
      'page_generic',
      'page_blog',
    ]),
  });

  return toCtaModule(raw);
}
