import { makeRawPostCard } from '@blog/service/testing/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getBlogPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getBlogPage', () => {
  it('returns the page window with page math for a full corpus', async () => {
    mockRun.mockResolvedValue({
      posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
      total: 20,
    });

    const result = await getBlogPage({ page: 2, pageSize: 9 });

    expect(result.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result.currentPage).toBe(2);
    expect(result.total).toBe(20);
    expect(result.totalPages).toBe(3); // ceil(20 / 9)
  });

  it('defaults to page 1 and POSTS_PER_PAGE', async () => {
    mockRun.mockResolvedValue({
      posts: [makeRawPostCard({ _id: 'a' })],
      total: 1,
    });

    const result = await getBlogPage();

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('returns totalPages 1 for an empty corpus', async () => {
    mockRun.mockResolvedValue({ posts: [], total: 0 });

    const result = await getBlogPage({ page: 1 });

    expect(result.posts).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // Math.max(1, ceil(0/9))
  });
});
