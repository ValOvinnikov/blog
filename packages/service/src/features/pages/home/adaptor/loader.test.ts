import { describe, expect, it, vi } from 'vitest';

import { mockRun } from '#/testing/mock-run-query';
import { makeRawPostCard } from '#/testing/pages/fixtures';

import { getHomePage } from './loader';

vi.mock('#/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getHomePage', () => {
  it('maps posts into featured and recent lists', async () => {
    mockRun.mockResolvedValue([
      makeRawPostCard({ _id: 'a', featured: true }),
      makeRawPostCard({ _id: 'b', featured: false }),
    ]);

    const page = await getHomePage();

    expect(page.recentPosts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(page.featuredPosts.map((p) => p.id)).toEqual(['a']);
  });

  it('builds a CDN url and passes through the alt text', async () => {
    mockRun.mockResolvedValue([makeRawPostCard()]);

    const page = await getHomePage();

    expect(page.recentPosts[0]?.mainImageUrl).toContain('cdn.sanity.io');
    expect(page.recentPosts[0]?.mainImageAlt).toBe('Alt text');
  });
});
