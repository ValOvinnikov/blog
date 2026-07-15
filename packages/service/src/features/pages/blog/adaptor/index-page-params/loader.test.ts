import { mockRun } from '@blog/service/testing/mock-run-query';
import { describe, expect, it, vi } from 'vitest';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', async () => {
    mockRun.mockResolvedValue(20);

    const params = await getIndexPageParams(9);

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when there is only one page', async () => {
    mockRun.mockResolvedValue(0);

    const params = await getIndexPageParams(9);

    expect(params).toEqual([]);
  });

  it('defaults to POSTS_PER_PAGE when no pageSize is given', async () => {
    mockRun.mockResolvedValue(20);

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });
});
