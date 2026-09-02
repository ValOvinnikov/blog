import { makeRawFeedPost } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPublishedPostsByTag } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPublishedPostsByTag, () => {
  it('fetches every published post tagged with the given tag id', async () => {
    mockRun.mockResolvedValue([
      makeRawFeedPost({ title: 'First', slug: 'first' }),
      makeRawFeedPost({ title: 'Second', slug: 'second' }),
    ]);

    const result = await getPublishedPostsByTag('tag-1', tenant);

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
  });

  it('passes the tag id as a query parameter', async () => {
    mockRun.mockResolvedValue([]);

    await getPublishedPostsByTag('tag-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { tagId: 'tag-1' } }),
    );
  });

  it('returns an empty array when no posts are tagged', async () => {
    mockRun.mockResolvedValue([]);

    const result = await getPublishedPostsByTag('tag-1', tenant);

    expect(result).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getPublishedPostsByTag('tag-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:posts'] }),
      }),
    );
  });
});
