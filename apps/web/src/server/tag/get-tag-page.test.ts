import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTagPage } from './get-tag-page';

const { getTagPageMock } = vi.hoisted(() => ({ getTagPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { tag: { v1: { getTagPage: getTagPageMock } } } },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: vi.fn(),
}));

describe(getTagPage, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('resolves the tenant Sanity context, then forwards the slug and that context to service.pages.tag.v1.getTagPage', async () => {
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getTagPage('typescript', 'tenant-1');

    expect(getTenantSanityContext).toHaveBeenCalledWith('tenant-1');
    expect(getTagPageMock).toHaveBeenCalledWith(
      'typescript',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getTagPage unchanged', async () => {
    const result = { ok: true, data: { tag: { title: 'TypeScript' } } };
    getTagPageMock.mockResolvedValue(result);

    await expect(getTagPage('typescript', 'tenant-1')).resolves.toBe(result);
  });
});

describe('getTagPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the tag-page query when called more than once in the same render pass with the same arguments', async () => {
    getTagPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

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

    const { getTagPage: freshGetTagPage } = await import('./get-tag-page');

    await freshGetTagPage('typescript', 'tenant-1');
    await freshGetTagPage('typescript', 'tenant-1');

    expect(getTagPageMock).toHaveBeenCalledTimes(1);
  });
});
