import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getAllPublishedPosts } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getAllPublishedPosts, () => {
  it('fetches every published post with no pagination parameters', async () => {
    mockRun.mockResolvedValue([
      makeRawFeedPost({ title: 'First', slug: 'first' }),
      makeRawFeedPost({ title: 'Second', slug: 'second' }),
    ]);

    const result = await getAllPublishedPosts(tenant);

    expect(result).toEqual([
      {
        title: 'First',
        slug: 'first',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
      {
        title: 'Second',
        slug: 'second',
        excerpt: 'A sufficiently long excerpt for the card.',
        publishedAt: '2026-01-15T00:00:00Z',
      },
    ]);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({ parameters: expect.anything() }),
    );
  });

  it('returns an empty array when there are no published posts', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getAllPublishedPosts(tenant);

    expect(result).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getAllPublishedPosts(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:posts'] }),
      }),
    );
  });
});
