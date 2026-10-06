import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawChildPage,
  makeRawChildPagesModule,
} from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getChildPagesModule } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getChildPagesModule, () => {
  it('resolves the module with the children of the hosting page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawChildPagesModule())
      .mockResolvedValueOnce([makeRawChildPage()]);

    const module = await getChildPagesModule(
      'child-pages-1',
      'page-modules',
      'modules',
      tenant,
    );

    expect(module.pages.map((page) => page.path)).toEqual(['modules/faq']);
  });

  it('scopes the module cache tags to the tenant', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawChildPagesModule())
      .mockResolvedValueOnce([]);

    await getChildPagesModule(
      'child-pages-1',
      'page-modules',
      'modules',
      tenant,
    );

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
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
    mockRun
      .mockRejectedValueOnce(new Error('ValidationError'))
      .mockResolvedValueOnce([]);

    await expect(
      getChildPagesModule('missing', 'page-modules', 'modules', tenant),
    ).rejects.toThrow();
  });
});
