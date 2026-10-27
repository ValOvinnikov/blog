import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TAG_SLUG } from '@web/testing/shared/tag/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTagPage } from './get-tag-page';

const { getTagPageMock } = vi.hoisted(() => ({ getTagPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { tag: { v1: { getTagPage: getTagPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTagPage, () => {
  it('loads the tag page by slug for the resolved tenant', async () => {
    getTagPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getTagPage(MOCK_TAG_SLUG);

    expect(getTagPageMock).toHaveBeenCalledWith(
      MOCK_TAG_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getTagPageMock.mockResolvedValueOnce(result);

    await expect(getTagPage(MOCK_TAG_SLUG)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass for the same slug', async () => {
      getTagPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getTagPage: memoizedGetTagPage } = await importWithMemoizingCache(
        () => import('./get-tag-page'),
      );

      await memoizedGetTagPage(MOCK_TAG_SLUG);
      await memoizedGetTagPage(MOCK_TAG_SLUG);

      expect(getTagPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
