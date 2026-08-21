import { isr, runQuery } from '@blog/service/sanity/query';

import { postLatestModulePostsQuery } from './posts.query';
import { postLatestModuleQuery } from './query';
import { toPostLatestModule } from './transformer';
import type { TPostLatestModule } from './types';

export async function getPostLatest(id: string): Promise<TPostLatestModule> {
  // Read the module document first so its `limit` can bound the posts query in
  // GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postLatestModuleQuery, {
    parameters: { id },
    ...isr(['modules:postLatest', `module:${id}`]),
  });

  // `postCardFragment` derefs `author`/`topic` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`).
  const rawPosts = await runQuery(postLatestModulePostsQuery(raw.limit), {
    ...isr(['posts', 'author', 'topic']),
  });

  return toPostLatestModule(raw, rawPosts);
}
