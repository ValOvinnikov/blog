import { runQuery, isr } from '#/sanity/query';
import {
  categoryPageCategoryQuery,
  categoryPagePostsQuery,
} from './query';
import { toCategoryPage } from './transformer';
import type { TCategoryPage } from './transformer';

export type { TCategoryPage };

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
