import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawBlogIndexSettings } from '@blog/service/testing/pages/fixtures';
import { describe, expect, it, vi } from 'vitest';

import { getIndexPageParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getIndexPageParams', () => {
  it('returns pages 2..totalPages for a full corpus', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogIndexSettings({ itemsPerPage: 9 }))
      .mockResolvedValueOnce(20);

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]);
  });

  it('returns an empty array when there is only one page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawBlogIndexSettings({ itemsPerPage: 9 }))
      .mockResolvedValueOnce(0);

    const params = await getIndexPageParams();

    expect(params).toEqual([]);
  });

  it('falls back to POSTS_PER_PAGE when the page_blog singleton is unauthored', async () => {
    mockRun.mockResolvedValueOnce(null).mockResolvedValueOnce(20);

    const params = await getIndexPageParams();

    expect(params).toEqual([{ page: '2' }, { page: '3' }]); // ceil(20 / 9)
  });
});
