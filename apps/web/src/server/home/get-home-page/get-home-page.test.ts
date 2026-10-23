import { okResult } from '@blog/utils';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getHomePage } from './get-home-page';

const { getHomePageMock } = vi.hoisted(() => ({ getHomePageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { home: { v1: { getHomePage: getHomePageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getHomePage, () => {
  beforeEach(() => {
    getHomePageMock.mockReset();
  });

  it('forwards the resolved tenant context to the home page service', async () => {
    getHomePageMock.mockResolvedValue(okResult());

    await getHomePage();

    expect(getHomePageMock).toHaveBeenCalledWith(MOCK_TENANT_SANITY_CONTEXT);
  });

  it('returns the raw TResult from getHomePage unchanged', async () => {
    const result = okResult({ modules: [] });
    getHomePageMock.mockResolvedValue(result);

    await expect(getHomePage()).resolves.toBe(result);
  });
});
