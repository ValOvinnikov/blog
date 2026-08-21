import { MODULE_PAGE_CONTEXT, type TModulePageContext } from '@blog/config';
import { isr, runQuery } from '@blog/service/sanity/query';

import {
  postListModulePaginatedPostsQuery,
  postListModulePostsQuery,
} from './posts.query';
import { postListModuleQuery } from './query';
import { toPostListModule } from './transformer';
import type { TPostListModule } from './types';

function scopeSlug(context?: TModulePageContext): string | undefined {
  if (context?.type === MODULE_PAGE_CONTEXT.TOPIC) return context.topicSlug;
  if (context?.type === MODULE_PAGE_CONTEXT.TAG) return context.tagSlug;
  return undefined;
}

export async function getPostList(
  id: string,
  context?: TModulePageContext,
): Promise<TPostListModule> {
  // Read the module document first so its `pageSize` can bound the posts
  // query in GROQ (avoids fetching the entire post collection to slice it in JS).
  const raw = await runQuery(postListModuleQuery, {
    parameters: { id },
    ...isr(['modules:postList', `module:${id}`]),
  });

  const parameters = { slug: scopeSlug(context) };
  // `postCardFragment` derefs `author`/`topic` — both tags must ride
  // alongside `posts` (tag-scope contract, `sanity/query.ts`).
  const postsIsr = isr(['posts', 'author', 'topic']);

  if (context?.isPaginated) {
    const rawPosts = await runQuery(
      postListModulePaginatedPostsQuery(context),
      {
        parameters,
        ...postsIsr,
      },
    );
    return toPostListModule(raw, rawPosts.posts, rawPosts.total);
  }

  const rawPosts = await runQuery(
    postListModulePostsQuery(raw.pageSize, context),
    {
      parameters,
      ...postsIsr,
    },
  );

  return toPostListModule(raw, rawPosts);
}
