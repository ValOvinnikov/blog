import { makeRawCategory } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getCategoryPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getCategoryPage', () => {
  it('returns null when the category is not found', async () => {
    mockRun.mockResolvedValueOnce(null).mockResolvedValueOnce([]);

    const result = await getCategoryPage('missing');

    expect(result).toBeNull();
  });

  it('maps the category and its posts into a page object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawCategory({ _id: 'cat-abc', title: 'Design' }),
      )
      .mockResolvedValueOnce([
        makeRawPostCard(),
        makeRawPostCard({ _id: 'post-2' }),
      ]);

    const result = await getCategoryPage('design');

    expect(result).not.toBeNull();
    expect(result?.category.id).toBe('cat-abc');
    expect(result?.category.title).toBe('Design');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns an empty posts list when no posts belong to the category', async () => {
    mockRun.mockResolvedValueOnce(makeRawCategory()).mockResolvedValueOnce([]);

    const result = await getCategoryPage('engineering');

    expect(result?.posts).toEqual([]);
  });

  it('leaves pagination fields undefined when called without a page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawCategory())
      .mockResolvedValueOnce([makeRawPostCard()]);

    const result = await getCategoryPage('engineering');

    expect(result?.currentPage).toBeUndefined();
    expect(result?.totalPages).toBeUndefined();
    expect(result?.total).toBeUndefined();
  });

  it('returns the sliced page window with pagination metadata when a page is given', async () => {
    mockRun.mockResolvedValueOnce(makeRawCategory()).mockResolvedValueOnce({
      posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
      total: 20,
    });

    const result = await getCategoryPage('engineering', { page: 2 });

    expect(result?.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result?.currentPage).toBe(2);
    expect(result?.total).toBe(20);
    expect(result?.totalPages).toBe(3); // ceil(20 / 9)
  });

  it('returns null for a paginated request when the category is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 });

    const result = await getCategoryPage('missing', { page: 2 });

    expect(result).toBeNull();
  });
});
