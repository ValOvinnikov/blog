import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import {
  importWithMemoizingCache,
  restoreReactCache,
} from '@web/testing/server/page-loaders/import-with-memoizing-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getCookieStatementPage } from './get-cookie-statement-page';

const { getCookieStatementPageMock } = vi.hoisted(() => ({
  getCookieStatementPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      cookieStatement: {
        v1: { getCookieStatementPage: getCookieStatementPageMock },
      },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

describe(getCookieStatementPage, () => {
  it('loads the cookie statement for the resolved tenant', async () => {
    getCookieStatementPageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getCookieStatementPage();

    expect(getCookieStatementPageMock).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getCookieStatementPageMock.mockResolvedValueOnce(result);

    await expect(getCookieStatementPage()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(restoreReactCache);

    it('queries once per render pass', async () => {
      getCookieStatementPageMock.mockResolvedValueOnce(mockPageLoaderResult());

      const { getCookieStatementPage: memoizedGetCookieStatementPage } =
        await importWithMemoizingCache(
          () => import('./get-cookie-statement-page'),
        );

      await memoizedGetCookieStatementPage();
      await memoizedGetCookieStatementPage();

      expect(getCookieStatementPageMock).toHaveBeenCalledTimes(1);
    });
  });
});
