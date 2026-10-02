import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostIndexPage } from './get-post-index-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { blog: { v1: { getIndexPage: getIndexPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getPostIndexPage, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
  });

  it('forwards the resolved tenant context to the blog index service', async () => {
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getPostIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getIndexPage unchanged', async () => {
    const result = { ok: true, data: { title: 'Blog' } };
    getIndexPageMock.mockResolvedValue(result);

    await expect(getPostIndexPage()).resolves.toBe(result);
  });
});

describe('getPostIndexPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the index-page query across one render pass with the same arguments', async () => {
    getIndexPageMock.mockReset();
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

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

    const { getPostIndexPage: freshGetPostIndexPage } =
      await import('./get-post-index-page');

    await freshGetPostIndexPage();
    await freshGetPostIndexPage();

    expect(getIndexPageMock).toHaveBeenCalledTimes(1);
  });
});
