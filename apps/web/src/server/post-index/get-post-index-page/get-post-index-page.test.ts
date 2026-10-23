import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostIndexPage } from './get-post-index-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { blog: { v1: { getIndexPage: getIndexPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getPostIndexPage, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
  });

  it('forwards the resolved tenant context to the blog index service', async () => {
    getIndexPageMock.mockResolvedValue(okResult());

    await getPostIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the raw TResult from getIndexPage unchanged', async () => {
    const result = okResult({ title: 'Blog' });
    getIndexPageMock.mockResolvedValue(result);

    await expect(getPostIndexPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the index-page query across one render pass with the same arguments', async () => {
      getIndexPageMock.mockResolvedValue(okResult());

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getPostIndexPage: freshGetPostIndexPage } =
        await import('./get-post-index-page');

      await freshGetPostIndexPage();
      await freshGetPostIndexPage();

      expect(getIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
