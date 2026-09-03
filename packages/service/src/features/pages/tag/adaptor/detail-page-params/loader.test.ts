import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTagParams } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getTagParams', () => {
  it('returns all slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'typescript' }, { slug: 'react' }]);

    const params = await getTagParams(tenant);

    expect(params).toEqual([{ slug: 'typescript' }, { slug: 'react' }]);
  });

  it('returns an empty array when there are no tag pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTagParams(tenant);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getTagParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_tag'] }),
      }),
    );
  });
});
