import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawChildPage } from '@blog/service/testing/modules/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getChildPages } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe(getChildPages, () => {
  it('queries the children of the hosting page and paths them beneath it', async () => {
    mockRun.mockResolvedValueOnce([makeRawChildPage()]);

    const pages = await getChildPages('page-modules', 'modules', tenant);

    expect(pages.map((page) => page.path)).toEqual(['modules/faq']);
    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        parameters: { parentId: 'page-modules' },
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:page_landing'] }),
      }),
    );
  });
});
