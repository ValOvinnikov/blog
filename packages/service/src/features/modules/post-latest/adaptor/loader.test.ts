import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostLatestModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostLatest } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPostLatest', () => {
  it('bounds the posts query by the module limit and maps the result', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostLatestModule({
          sectionHeader: {
            heading: 'Recent writing',
            supportingText: null,
            align: null,
          },
          limit: 3,
        }),
      )
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    const postLatest = await getPostLatest('post-latest-1', tenant);

    // The module's `limit` is threaded into the GROQ posts query's slice bound.
    expect(mockRun.mock.calls[1]?.[0]?.query).toContain('[0...3]');
    expect(postLatest.sectionHeader.heading).toBe('Recent writing');
    expect(postLatest.posts.map((p) => p.id)).toEqual(['a']);
  });

  it('returns an empty list when no posts resolve', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostLatestModule({ limit: 3 }))
      .mockResolvedValueOnce([]);

    const postLatest = await getPostLatest('post-latest-1', tenant);

    expect(postLatest.posts).toEqual([]);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(getPostLatest('missing', tenant)).rejects.toThrow();
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostLatestModule({ limit: 3 }))
      .mockResolvedValueOnce([makeRawPostCard({ _id: 'a' })]);

    await getPostLatest('post-latest-1', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:postLatest',
            't:tenant-a:module:post-latest-1',
          ],
        }),
      }),
    );
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:posts', 't:tenant-a:author', 't:tenant-a:topic'],
        }),
      }),
    );
  });
});
