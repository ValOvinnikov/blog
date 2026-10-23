import { okResult } from '@blog/utils';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getSiteSettings } from './get-site-settings';

const { getSiteSettingsMock } = vi.hoisted(() => ({
  getSiteSettingsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    global: { siteSettings: { v1: { getSiteSettings: getSiteSettingsMock } } },
  },
}));

vi.mock('@web/server/request-context/request-context');

describe(getSiteSettings, () => {
  beforeEach(() => {
    getSiteSettingsMock.mockReset();
  });

  it('forwards the resolved tenant context to the site settings service', async () => {
    getSiteSettingsMock.mockResolvedValue(okResult({}));

    await getSiteSettings();

    expect(getSiteSettingsMock).toHaveBeenCalledWith(
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from the service unchanged', async () => {
    const result = okResult({ brand: { name: 'Blog' } });
    getSiteSettingsMock.mockResolvedValue(result);

    await expect(getSiteSettings()).resolves.toBe(result);
  });

  describe('memoization', () => {
    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('fetches once however many components read it in one render pass', async () => {
      getSiteSettingsMock.mockResolvedValue(okResult({}));

      vi.doMock('react', withMemoizingReactCache);
      vi.resetModules();

      const { getSiteSettings: freshGetSiteSettings } =
        await import('./get-site-settings');

      await freshGetSiteSettings();
      await freshGetSiteSettings();
      await freshGetSiteSettings();

      expect(getSiteSettingsMock).toHaveBeenCalledTimes(1);
    });
  });
});
