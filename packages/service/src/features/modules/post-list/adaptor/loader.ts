import { isr, runQuery } from '@blog/service/sanity/query';

import { postListModulePostsQuery } from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

export async function getPostList(id: string): Promise<TPostListModule> {
  // Read the module document first so its `limit` can bound the posts query in
  // GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    ...isr(['modules:postList', `module:${id}`]),
  });

  // `postCardFragment` derefs `author`/`category` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`).
  const rawPosts = await runQuery(
    postListModulePostsQuery(raw.limit),
    isr(['posts', 'author', 'category']),
  );

  return toPostListModule(raw, rawPosts);
}
