import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPostParams', () => {
  it('returns all slug and publishedAt entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'post-a', publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'post-b', publishedAt: '2026-02-01T00:00:00Z' },
    ]);

    const params = await getPostParams(tenant);

    expect(params).toEqual([
      { slug: 'post-a', publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'post-b', publishedAt: '2026-02-01T00:00:00Z' },
    ]);
  });

  it('returns an empty array when there are no posts', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getPostParams(tenant);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getPostParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_post'] }),
      }),
    );
  });
});
