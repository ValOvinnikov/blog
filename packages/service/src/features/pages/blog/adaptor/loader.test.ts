import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getBlogPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getBlogPage', () => {
  it('maps every post into a card', async () => {
    mockRun.mockResolvedValue([
      makeRawPostCard({ _id: 'a' }),
      makeRawPostCard({ _id: 'b' }),
    ]);

    const page = await getBlogPage();

    expect(page.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(page.posts[0]?.title).toBe('Hello World');
  });

  it('returns an empty list when there are no posts', async () => {
    mockRun.mockResolvedValue([]);

    const page = await getBlogPage();

    expect(page.posts).toEqual([]);
  });
});
