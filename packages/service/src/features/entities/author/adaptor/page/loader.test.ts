import { toAuthorDetail } from '@blog/service/features/entities/author/adaptor/detail/transformer';
import { toAuthorPosts } from '@blog/service/features/entities/author/adaptor/posts/transformer';
import { makeRawAuthor } from '@blog/service/testing/entities/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getAuthorPage } from './loader';

vi.mock('@blog/service/features/entities/author/adaptor/detail/loader', () => ({
  getAuthor: vi.fn(),
}));
vi.mock('@blog/service/features/entities/author/adaptor/posts/loader', () => ({
  getAuthorPosts: vi.fn(),
}));

const { getAuthor } =
  await import('@blog/service/features/entities/author/adaptor/detail/loader');
const { getAuthorPosts } =
  await import('@blog/service/features/entities/author/adaptor/posts/loader');

describe('getAuthorPage', () => {
  it('returns the author and posts together', async () => {
    const author = toAuthorDetail(
      makeRawAuthor({ _id: 'author-abc', name: 'John Smith' }),
    );
    const posts = toAuthorPosts([
      makeRawPostCard({ _id: 'post-1' }),
      makeRawPostCard({ _id: 'post-2' }),
    ]);
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(posts);

    const result = await getAuthorPage('john-smith');

    expect(result?.author.id).toBe('author-abc');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns null when the author is not found, regardless of posts', async () => {
    vi.mocked(getAuthor).mockResolvedValueOnce(null);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(
      toAuthorPosts([makeRawPostCard()]),
    );

    const result = await getAuthorPage('missing');

    expect(result).toBeNull();
  });

  it('returns an empty posts array when the author has no posts', async () => {
    const author = toAuthorDetail(makeRawAuthor());
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce([]);

    const result = await getAuthorPage('no-posts-author');

    expect(result?.posts).toEqual([]);
  });
});
