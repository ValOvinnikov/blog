import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTagIndexPage } from './get-tag-index-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { tagIndex: { v1: { getIndexPage: getIndexPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTagIndexPage, () => {
  it('loads the tag index for the resolved tenant', async () => {
    getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getTagIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getIndexPageMock.mockResolvedValueOnce(result);

    await expect(getTagIndexPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass', async () => {
      getIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getTagIndexPage: memoizedGetTagIndexPage } =
        await importWithMemoizingCache(() => import('./get-tag-index-page'));

      await memoizedGetTagIndexPage();
      await memoizedGetTagIndexPage();

      expect(getIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
