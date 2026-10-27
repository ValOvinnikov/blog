import { mockPageLoaderResult } from '@web/testing/server/page-loaders/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getHomePage } from './get-home-page';

const { getHomePageMock } = vi.hoisted(() => ({ getHomePageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { home: { v1: { getHomePage: getHomePageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getHomePage, () => {
  it('loads the home page for the resolved tenant', async () => {
    getHomePageMock.mockResolvedValueOnce(mockPageLoaderResult());

    await getHomePage();

    expect(getHomePageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the service result unchanged', async () => {
    const result = mockPageLoaderResult();
    getHomePageMock.mockResolvedValueOnce(result);

    await expect(getHomePage()).resolves.toBe(result);
  });
});
