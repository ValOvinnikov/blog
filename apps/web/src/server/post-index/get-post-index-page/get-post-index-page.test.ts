import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostIndexPage } from './get-post-index-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { blog: { v1: { getIndexPage: getIndexPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getPostIndexPage, () => {
  it('loads the blog index for the resolved tenant', async () => {
    getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getPostIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getIndexPageMock.mockResolvedValueOnce(result);

    await expect(getPostIndexPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass', async () => {
      getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getPostIndexPage: memoizedGetPostIndexPage } =
        await importWithMemoizingCache(() => import('./get-post-index-page'));

      await memoizedGetPostIndexPage();
      await memoizedGetPostIndexPage();

      expect(getIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
