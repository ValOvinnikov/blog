import { mockRun } from '@blog/service/testing/mock-run-query';

import { getPostParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPostParams', () => {
  it('returns all slug and publishedAt entries', async () => {
    mockRun.mockResolvedValue([
      { slug: 'post-a', publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'post-b', publishedAt: '2026-02-01T00:00:00Z' },
    ]);

    const params = await getPostParams();

    expect(params).toEqual([
      { slug: 'post-a', publishedAt: '2026-01-01T00:00:00Z' },
      { slug: 'post-b', publishedAt: '2026-02-01T00:00:00Z' },
    ]);
  });

  it('returns an empty array when there are no posts', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getPostParams();

    expect(params).toEqual([]);
  });
});
