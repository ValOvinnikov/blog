import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', async () => {
    mockRun.mockResolvedValueOnce({
      blogPosts: { total: 20 },
      itemsPerPage: 9,
    });

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when there is only one page', async () => {
    mockRun.mockResolvedValueOnce({ blogPosts: { total: 0 }, itemsPerPage: 9 });

    const params = await getIndexPageParams();

    expect(params).toEqual([]);
  });
});
