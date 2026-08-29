import { isr, runQuery } from '@blog/service/sanity/query';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

// `ctaModuleQuery` projects `actions` through `actionGroupFragment`, whose
// items' `link` is projected through `linkFragment` — its `internalReference`
// can resolve to `blog_post`/`blog_topic`/`page_generic`/`page_blog`, so
// every one of those types' tags must be included (tag-scope contract,
// `sanity/query.ts`). `content`'s inline link annotations reuse the same
// `link` object, but this query selects `content[]` raw with no `.deref()`
// on its markDefs — so it introduces no additional tag-scope requirement,
// and would still be covered by this same list if that changed.
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
