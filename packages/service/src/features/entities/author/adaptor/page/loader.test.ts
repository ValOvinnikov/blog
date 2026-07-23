import { toAuthorDetail } from '@blog/service/features/entities/author/adaptor/detail-page/transformer';
import { toAuthorPosts } from '@blog/service/features/entities/author/adaptor/posts/transformer';
import { makeRawAuthor } from '@blog/service/testing/entities/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';

import { getAuthorPage } from './loader';

vi.mock(
  '@blog/service/features/entities/author/adaptor/detail-page/loader',
  () => ({
    getAuthor: vi.fn(),
  }),
);
vi.mock('@blog/service/features/entities/author/adaptor/posts/loader', () => ({
  getAuthorPosts: vi.fn(),
}));

const { getAuthor } =
  await import('@blog/service/features/entities/author/adaptor/detail-page/loader');
const { getAuthorPosts } =
  await import('@blog/service/features/entities/author/adaptor/posts/loader');

describe('getAuthorPage', () => {
  it('returns the author and posts together', async () => {
    const author = toAuthorDetail(
      makeRawAuthor({ _id: 'author-abc', name: 'John Smith' }),
    );
    const { posts, total } = toAuthorPosts(
      [makeRawPostCard({ _id: 'post-1' }), makeRawPostCard({ _id: 'post-2' })],
      2,
    );
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce({ posts, total });

    const result = await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(result?.author.id).toBe('author-abc');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns null when the author is not found, regardless of posts', async () => {
    vi.mocked(getAuthor).mockResolvedValueOnce(null);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(
      toAuthorPosts([makeRawPostCard()], 1),
    );

    const result = await getAuthorPage('missing', { itemsPerPage: 9 });

    expect(result).toBeNull();
  });

  it('returns an empty posts array when the author has no posts', async () => {
    const author = toAuthorDetail(makeRawAuthor());
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(toAuthorPosts([], 0));

    const result = await getAuthorPage('no-posts-author', { itemsPerPage: 9 });

    expect(result?.posts).toEqual([]);
  });

  it('defaults to page 1 and returns pagination metadata when called without a page', async () => {
    const author = toAuthorDetail(makeRawAuthor());
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(
      toAuthorPosts([makeRawPostCard()], 1),
    );

    const result = await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(result?.currentPage).toBe(1);
    expect(result?.totalPages).toBe(1);
    expect(result?.total).toBe(1);
    expect(getAuthorPosts).toHaveBeenCalledWith('john-smith', {
      page: 1,
      itemsPerPage: 9,
    });
  });

  it('passes the given page through to getAuthorPosts and computes totalPages', async () => {
    const author = toAuthorDetail(makeRawAuthor());
    vi.mocked(getAuthor).mockResolvedValueOnce(author);
    vi.mocked(getAuthorPosts).mockResolvedValueOnce(
      toAuthorPosts(
        [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
        20,
      ),
    );

    const result = await getAuthorPage('john-smith', {
      page: 2,
      itemsPerPage: 5,
    });

    expect(result?.posts.map((post) => post.id)).toEqual(['a', 'b']);
    expect(result?.currentPage).toBe(2);
    expect(result?.total).toBe(20);
    expect(result?.totalPages).toBe(4);
    expect(getAuthorPosts).toHaveBeenCalledWith('john-smith', {
      page: 2,
      itemsPerPage: 5,
    });
  });
});
