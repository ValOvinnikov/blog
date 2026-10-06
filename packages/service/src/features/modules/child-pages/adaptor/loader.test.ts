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
      'modules',
      tenant,
    );

    expect(module.pages.map((page) => page.path)).toEqual(['modules/faq']);
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ parameters: { parentPath: 'modules' } }),
    );
  });

  it('scopes cache tags to the tenant, purging on module and Landing page changes', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawChildPagesModule())
      .mockResolvedValueOnce([]);

    await getChildPagesModule('child-pages-1', 'modules', tenant);

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
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_landing'] }),
      }),
    );
  });

  it('propagates when the module document is missing', async () => {
    mockRun
      .mockRejectedValueOnce(new Error('ValidationError'))
      .mockResolvedValueOnce([]);

    await expect(
      getChildPagesModule('missing', 'modules', tenant),
    ).rejects.toThrow();
  });
});
