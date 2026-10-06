import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostRelatedModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPostRelatedModuleDocument } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getPostRelatedModuleDocument, () => {
  it('resolves the module document fields, including its limit', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostRelatedModule({ limit: 6 }));

    const module = await getPostRelatedModuleDocument('post-related-1', tenant);

    expect(module.limit).toBe(6);
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(
      getPostRelatedModuleDocument('missing', tenant),
    ).rejects.toThrow();
  });

  it('threads tenant context into the module query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostRelatedModule({ limit: 3 }));

    await getPostRelatedModuleDocument('post-related-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { id: 'post-related-1' },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:postRelated',
            't:tenant-a:module:post-related-1',
          ],
        }),
      }),
    );
  });
});
