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

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getPageSlugs(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_generic'] }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue([]);

    await getPageSlugs();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant: undefined,
        next: expect.objectContaining({ tags: ['page_generic'] }),
      }),
    );
  });
});
