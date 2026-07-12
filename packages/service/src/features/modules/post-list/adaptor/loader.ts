import { isr, runQuery } from '#/sanity/query';

import { postListModulePostsQuery } from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

export async function getPostList(id: string): Promise<TPostListModule> {
  const [raw, rawPosts] = await Promise.all([
    runQuery(postListModuleQuery, {
      parameters: { id },
      ...isr(['modules:postList', `module:${id}`]),
    }),
    runQuery(postListModulePostsQuery, isr('posts')),
  ]);

  return toPostListModule(raw, rawPosts);
}
