import { faker } from '@faker-js/faker';
import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getSectionDocumentPage } from './get-section-document-page';

faker.seed(6522);

const MOCK_TYPE = 'page_privacyDocument';
const MOCK_SLUG = faker.lorem.slug();

const { getSectionDocumentMock } = vi.hoisted(() => ({
  getSectionDocumentMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      sectionDocument: { v1: { getSectionDocument: getSectionDocumentMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

describe(getSectionDocumentPage, () => {
  it('loads the document by type and slug for the resolved tenant', async () => {
    getSectionDocumentMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getSectionDocumentPage(MOCK_TYPE, MOCK_SLUG);

    expect(getSectionDocumentMock).toHaveBeenCalledWith(
      MOCK_TYPE,
      MOCK_SLUG,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getSectionDocumentMock.mockResolvedValueOnce(result);

    await expect(getSectionDocumentPage(MOCK_TYPE, MOCK_SLUG)).resolves.toBe(
      result,
    );
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass for the same document', async () => {
      getSectionDocumentMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getSectionDocumentPage: memoizedGetSectionDocumentPage } =
        await importWithMemoizingCache(
          () => import('./get-section-document-page'),
        );
      await memoizedGetSectionDocumentPage(MOCK_TYPE, MOCK_SLUG);
      await memoizedGetSectionDocumentPage(MOCK_TYPE, MOCK_SLUG);

      expect(getSectionDocumentMock).toHaveBeenCalledTimes(1);
    });
  });
});
