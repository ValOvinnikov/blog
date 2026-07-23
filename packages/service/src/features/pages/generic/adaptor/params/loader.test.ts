import { mockRun } from '@blog/service/testing/mock-run-query';

import { getPageSlugs } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getPageSlugs', () => {
  it('returns all page_generic slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'about' }, { slug: 'contact' }]);

    const params = await getPageSlugs();

    expect(params).toEqual([{ slug: 'about' }, { slug: 'contact' }]);
  });

  it('returns an empty array when no generic pages exist', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getPageSlugs();

    expect(params).toEqual([]);
  });
});
