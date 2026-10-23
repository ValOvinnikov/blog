import { okResult } from '@blog/utils';
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
});

describe('getSiteSettings memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('fetches once however many components read it in one render pass', async () => {
    getSiteSettingsMock.mockReset();
    getSiteSettingsMock.mockResolvedValue(okResult({}));

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: <T extends (...args: never[]) => unknown>(fn: T) => {
          const cacheByArgs = new Map<string, unknown>();
          return ((...args: never[]) => {
            const key = JSON.stringify(args);
            if (!cacheByArgs.has(key)) {
              cacheByArgs.set(key, fn(...args));
            }
            return cacheByArgs.get(key);
          }) as T;
        },
      };
    });
    vi.resetModules();

    const { getSiteSettings: freshGetSiteSettings } =
      await import('./get-site-settings');

    await freshGetSiteSettings();
    await freshGetSiteSettings();
    await freshGetSiteSettings();

    expect(getSiteSettingsMock).toHaveBeenCalledTimes(1);
  });
});
