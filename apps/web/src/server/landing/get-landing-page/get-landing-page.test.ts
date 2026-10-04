import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getLandingPage } from './get-landing-page';

const { getPageMock } = vi.hoisted(() => ({ getPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { landing: { v1: { getPage: getPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getLandingPage, () => {
  beforeEach(() => {
    getPageMock.mockReset();
  });

  it('forwards the slug and the resolved tenant context to the landing page service', async () => {
    getPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getLandingPage('about-us');

    expect(getPageMock).toHaveBeenCalledWith(
      'about-us',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getPage unchanged', async () => {
    const result = { ok: true, data: { title: 'About Us' } };
    getPageMock.mockResolvedValue(result);

    await expect(getLandingPage('about-us')).resolves.toBe(result);
  });
});

describe('getLandingPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the page query across one render pass with the same arguments', async () => {
    getPageMock.mockReset();
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

    await freshGetLandingPage('about-us');
    await freshGetLandingPage('about-us');

    expect(getPageMock).toHaveBeenCalledTimes(1);
  });
});
