import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawArchivePostCard } from '@blog/service/testing/pages/fixtures';

import { getCategoryPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategoryPage', () => {
  it('returns null when the category is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getCategoryPage('missing', { itemsPerPage: 9 });

    expect(result).toBeNull();
  });

  it('maps the category and its posts into a page object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawCategory({ _id: 'cat-abc', title: 'Design' }),
      )
      .mockResolvedValueOnce({
        posts: [
          makeRawArchivePostCard(),
          makeRawArchivePostCard({ _id: 'post-2' }),
        ],
        total: 2,
      });

    const result = await getCategoryPage('design', { itemsPerPage: 9 });

    expect(result).not.toBeNull();
    expect(result?.category.id).toBe('cat-abc');
    expect(result?.category.title).toBe('Design');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns an empty posts list when no posts belong to the category', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawCategory())
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getCategoryPage('engineering', { itemsPerPage: 9 });

    expect(result?.posts).toEqual([]);
  });

  it('defaults to page 1 and returns pagination metadata when called without a page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawCategory())
      .mockResolvedValueOnce({ posts: [makeRawArchivePostCard()], total: 1 });

    const result = await getCategoryPage('engineering', { itemsPerPage: 9 });

    expect(result?.currentPage).toBe(1);
    expect(result?.totalPages).toBe(1);
  });

  it('returns the sliced page window with pagination metadata when a page is given', async () => {
    mockRun.mockResolvedValueOnce(makeRawCategory()).mockResolvedValueOnce({
      posts: [
        makeRawArchivePostCard({ _id: 'a' }),
        makeRawArchivePostCard({ _id: 'b' }),
      ],
      total: 20,
    });

    const result = await getCategoryPage('engineering', {
      page: 2,
      itemsPerPage: 5,
    });

    expect(result?.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result?.currentPage).toBe(2);
    expect(result?.totalPages).toBe(4);
  });

  it('returns null for a paginated request when the category is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getCategoryPage('missing', {
      page: 2,
      itemsPerPage: 9,
    });

    expect(result).toBeNull();
  });
});
