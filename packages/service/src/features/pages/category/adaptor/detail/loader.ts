import { isr, runQuery } from '@blog/service/sanity/query';

import { categoryPageCategoryQuery } from './category.query';
import { categoryPagePostsQuery } from './posts.query';
import { toCategoryPage } from './transformer';
import type { TCategoryPage } from './types';

export async function getCategoryPage(
  slug: string,
): Promise<TCategoryPage | null> {
  const [rawCategory, rawPosts] = await Promise.all([
    runQuery(categoryPageCategoryQuery, {
      parameters: { slug },
      ...isr('category'),
    }),
    runQuery(categoryPagePostsQuery, {
      parameters: { slug },
      ...isr('posts'),
    }),
  ]);
  if (!rawCategory) return null;
  return toCategoryPage(rawCategory, rawPosts);
}
