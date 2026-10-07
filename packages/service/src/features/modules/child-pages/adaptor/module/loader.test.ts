import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawChildPagesModule } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getChildPagesModuleDocument } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getChildPagesModuleDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(makeRawChildPagesModule());
  });

  it('resolves the module document fields', async () => {
    const module = await getChildPagesModuleDocument('child-pages-1', tenant);

    expect(module.headingBlock?.heading).toBe('In this section');
  });

  it('scopes the module cache tags to the tenant', async () => {
    await getChildPagesModuleDocument('child-pages-1', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { id: 'child-pages-1' },
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:modules:childPages',
            't:tenant-a:module:child-pages-1',
          ],
        }),
      }),
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(new Error('ValidationError'));

    await expect(
      getChildPagesModuleDocument('missing', tenant),
    ).rejects.toThrow();
  });
});
