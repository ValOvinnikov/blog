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

  it('returns an empty array when there are no tag pages', async () => {
    mockRun.mockResolvedValue([]);

    const params = await getTagParams();

    expect(params).toEqual([]);
  });

  it('tags the query with page_tag', async () => {
    mockRun.mockResolvedValue([]);

    await getTagParams();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({ tags: ['page_tag'] }),
      }),
    );
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue([]);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getTagParams(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_tag'] }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue([]);

    await getTagParams();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenant: undefined }),
    );
  });
});
