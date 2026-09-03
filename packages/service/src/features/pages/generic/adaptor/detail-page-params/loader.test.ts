import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPageSlugs } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPageSlugs', () => {
  it('returns all page_generic slug entries', async () => {
    mockRun.mockResolvedValue([{ slug: 'about' }, { slug: 'contact' }]);

    const params = await getPageSlugs(tenant);

    expect(params).toEqual([{ slug: 'about' }, { slug: 'contact' }]);
  });

  it('returns an empty array when no generic pages exist', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getPageSlugs(tenant);

    expect(params).toEqual([]);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);

    await getPageSlugs(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_generic'] }),
      }),
    );
  });
});
