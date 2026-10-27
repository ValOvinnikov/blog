import { faker } from '@faker-js/faker';
import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getLandingPage } from './get-landing-page';

faker.seed(6012);

const MOCK_PAGE_SEGMENTS = [faker.lorem.slug(), faker.lorem.slug()];
const MOCK_PAGE_PATH = MOCK_PAGE_SEGMENTS.join('/');

const { getPageMock } = vi.hoisted(() => ({ getPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { landing: { v1: { getPage: getPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getLandingPage, () => {
  it('loads the page by path segments for the resolved tenant', async () => {
    getPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getLandingPage(MOCK_PAGE_PATH);

    expect(getPageMock).toHaveBeenCalledWith(
      MOCK_PAGE_SEGMENTS,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getPageMock.mockResolvedValueOnce(result);

    await expect(getLandingPage(MOCK_PAGE_PATH)).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass for the same path', async () => {
      getPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getLandingPage: memoizedGetLandingPage } =
        await importWithMemoizingCache(() => import('./get-landing-page'));

      await memoizedGetLandingPage(MOCK_PAGE_PATH);
      await memoizedGetLandingPage(MOCK_PAGE_PATH);

      expect(getPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
