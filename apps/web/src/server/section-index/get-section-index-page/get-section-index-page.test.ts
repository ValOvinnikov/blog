import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getSectionIndexPage } from './get-section-index-page';

const { getSectionIndexPageMock } = vi.hoisted(() => ({
  getSectionIndexPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      sectionIndex: { v1: { getSectionIndexPage: getSectionIndexPageMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const TYPE = 'page_legalIndex';

describe(getSectionIndexPage, () => {
  it('loads the hub of the given type for the resolved tenant', async () => {
    getSectionIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getSectionIndexPage(TYPE);

    expect(getSectionIndexPageMock).toHaveBeenCalledWith(
      TYPE,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getSectionIndexPageMock.mockResolvedValueOnce(result);

    await expect(getSectionIndexPage(TYPE)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per type per render pass', async () => {
      getSectionIndexPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getSectionIndexPage: memoizedGetSectionIndexPage } =
        await importWithMemoizingCache(
          () => import('./get-section-index-page'),
        );

      await memoizedGetSectionIndexPage(TYPE);
      await memoizedGetSectionIndexPage(TYPE);

      expect(getSectionIndexPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
