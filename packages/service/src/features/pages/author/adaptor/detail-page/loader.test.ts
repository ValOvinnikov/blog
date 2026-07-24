import { makeRawAuthor } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { getAuthorPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getAuthorPage', () => {
  it('returns null when the author is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getAuthorPage('missing', { itemsPerPage: 9 });

    expect(result).toBeNull();
  });

  it('maps the author and its posts into a page object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawAuthor({ _id: 'author-abc', name: 'John Smith' }),
      )
      .mockResolvedValueOnce({
        posts: [
          makeRawArchivePostCard({ _id: 'post-1' }),
          makeRawArchivePostCard({ _id: 'post-2' }),
        ],
        total: 2,
      });

    const result = await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(result).not.toBeNull();
    expect(result?.author.id).toBe('author-abc');
    expect(result?.author.name).toBe('John Smith');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns an empty posts array when the author has no posts', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawAuthor())
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getAuthorPage('no-posts-author', { itemsPerPage: 9 });

    expect(result?.posts).toEqual([]);
  });

  it('defaults to page 1 and returns pagination metadata when called without a page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawAuthor())
      .mockResolvedValueOnce({ posts: [makeRawArchivePostCard()], total: 1 });

    const result = await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(result?.currentPage).toBe(1);
    expect(result?.totalPages).toBe(1);
  });

  it('returns the sliced page window with pagination metadata when a page is given', async () => {
    mockRun.mockResolvedValueOnce(makeRawAuthor()).mockResolvedValueOnce({
      posts: [
        makeRawArchivePostCard({ _id: 'a' }),
        makeRawArchivePostCard({ _id: 'b' }),
      ],
      total: 20,
    });

    const result = await getAuthorPage('john-smith', {
      page: 2,
      itemsPerPage: 5,
    });

    expect(result?.posts.map((post) => post.id)).toEqual(['a', 'b']);
    expect(result?.currentPage).toBe(2);
    expect(result?.totalPages).toBe(4);
  });

  it('returns null for a paginated request when the author is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getAuthorPage('missing', {
      page: 2,
      itemsPerPage: 9,
    });

    expect(result).toBeNull();
  });

  it('passes the slug as a query parameter to both queries', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawAuthor())
      .mockResolvedValueOnce({ posts: [], total: 0 });

    await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'john-smith' } }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'john-smith' } }),
    );
  });

  it('tags the author query with author, and the posts query with posts alongside category', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawAuthor())
      .mockResolvedValueOnce({ posts: [], total: 0 });

    await getAuthorPage('john-smith', { itemsPerPage: 9 });

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: { revalidate: 3600, tags: ['author'] },
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        next: { revalidate: 3600, tags: ['posts', 'category'] },
      }),
    );
  });
});
