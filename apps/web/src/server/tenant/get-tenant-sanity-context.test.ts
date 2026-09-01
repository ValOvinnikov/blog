import { queries } from '@blog/db';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';

import { getTenantSanityContext } from './get-tenant-sanity-context';

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityCredentials: vi.fn() } },
}));

describe(getTenantSanityContext, () => {
  it('resolves undefined when no tenant is resolved for the request', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue(undefined);

    await expect(getTenantSanityContext()).resolves.toBeUndefined();
    expect(queries.tenants.getTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('resolves the tenant Sanity credentials for the request-scoped tenant id', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue('tenant-uuid');
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });

    await expect(getTenantSanityContext()).resolves.toEqual({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledWith(
      'tenant-uuid',
    );
  });
});

describe('getTenantSanityContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the tenant credentials query when called more than once in the same render pass', async () => {
    // `getRequestTenantId`/`queries` are replaced module-wide by the
    // `vi.mock()` calls above — that replacement is pinned for the whole
    // file and survives `resetModules()`, so the fresh, `resetModules()`-
    // triggered re-evaluation below reuses these same mock instances; only
    // `get-tenant-sanity-context.ts` itself (a plain, non-mocked module)
    // needs re-importing to pick up the mocked `react.cache`.
    vi.mocked(getRequestTenantId).mockReset();
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockReset();
    vi.mocked(getRequestTenantId).mockResolvedValue('tenant-uuid');
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: (fn: () => unknown) => {
          let called = false;
          let result: unknown;
          return () => {
            if (!called) {
              result = fn();
              called = true;
            }
            return result;
          };
        },
      };
    });
    vi.resetModules();

    const { getTenantSanityContext: freshGetTenantSanityContext } =
      await import('./get-tenant-sanity-context');

    await freshGetTenantSanityContext();
    await freshGetTenantSanityContext();

    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledTimes(1);
  });
});
