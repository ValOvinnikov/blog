import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getLandingPage } from './get-landing-page';

const { getPageMock } = vi.hoisted(() => ({ getPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { landing: { v1: { getPage: getPageMock } } } },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: vi.fn(),
}));

describe(getLandingPage, () => {
  beforeEach(() => {
    getPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('resolves the tenant Sanity context, then forwards the slug and that context to service.pages.landing.v1.getPage', async () => {
    getPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getLandingPage('about-us', 'tenant-1');

    expect(getTenantSanityContext).toHaveBeenCalledWith('tenant-1');
    expect(getPageMock).toHaveBeenCalledWith(
      'about-us',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getPage unchanged', async () => {
    const result = { ok: true, data: { title: 'About Us' } };
    getPageMock.mockResolvedValue(result);

    await expect(getLandingPage('about-us', 'tenant-1')).resolves.toBe(result);
  });
});

describe('getLandingPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the page query when called more than once in the same render pass with the same arguments', async () => {
    getPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    getPageMock.mockResolvedValue({ ok: true, data: undefined });

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

    const { getLandingPage: freshGetLandingPage } =
      await import('./get-landing-page');

    await freshGetLandingPage('about-us', 'tenant-1');
    await freshGetLandingPage('about-us', 'tenant-1');

    expect(getPageMock).toHaveBeenCalledTimes(1);
  });
});
