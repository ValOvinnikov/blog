import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getBlogListPage } from './get-blog-list-page';

const { getIndexPageMock } = vi.hoisted(() => ({ getIndexPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { blog: { v1: { getIndexPage: getIndexPageMock } } } },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: vi.fn(),
}));

describe(getBlogListPage, () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('resolves the tenant Sanity context, then forwards it to service.pages.blog.v1.getIndexPage', async () => {
    getIndexPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getBlogListPage('tenant-1');

    expect(getTenantSanityContext).toHaveBeenCalledWith('tenant-1');
    expect(getIndexPageMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getIndexPage unchanged', async () => {
    const result = { ok: true, data: { title: 'Blog' } };
    getIndexPageMock.mockResolvedValue(result);

    await expect(getBlogListPage('tenant-1')).resolves.toBe(result);
  });
});

describe('getBlogListPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the index-page query when called more than once in the same render pass with the same arguments', async () => {
    getIndexPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
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

    const { getBlogListPage: freshGetBlogListPage } =
      await import('./get-blog-list-page');

    await freshGetBlogListPage('tenant-1');
    await freshGetBlogListPage('tenant-1');

    expect(getIndexPageMock).toHaveBeenCalledTimes(1);
  });
});
