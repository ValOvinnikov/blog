import { getAuthor } from '@blog/service/features/entities/author/adaptor/detail-page/loader';
import { getAuthorPosts } from '@blog/service/features/entities/author/adaptor/posts/loader';

import type { TAuthorPage } from './types';

/**
 * Composes the two existing author loaders into a single call for the
 * author page route. Returns `null` when the author itself isn't found,
 * regardless of what `getAuthorPosts` resolved to.
 */
export async function getAuthorPage(slug: string): Promise<TAuthorPage | null> {
  const [author, posts] = await Promise.all([
    getAuthor(slug),
    getAuthorPosts(slug),
  ]);
  if (!author) return null;
  return { author, posts };
}
