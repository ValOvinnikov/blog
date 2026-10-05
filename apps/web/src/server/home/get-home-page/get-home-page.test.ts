import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

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
    getHomePageMock.mockResolvedValue({ ok: true, data: undefined });

    await getHomePage();

    expect(getHomePageMock).toHaveBeenCalledWith(DEFAULT_TENANT_SANITY_CONTEXT);
  });

  it('returns the raw TResult from getHomePage unchanged', async () => {
    const result = { ok: true, data: { modules: [] } };
    getHomePageMock.mockResolvedValue(result);

    await expect(getHomePage()).resolves.toBe(result);
  });
});
