import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTagParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTagParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'typescript' }, { slug: 'react' }]);

    const params = await getTagParams();

    expect(params).toEqual([{ slug: 'typescript' }, { slug: 'react' }]);
  });

  it('returns an empty array when there are no tags', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTagParams();

    expect(params).toEqual([]);
  });
});
