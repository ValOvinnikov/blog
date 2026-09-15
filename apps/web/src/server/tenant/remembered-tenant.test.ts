import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

describe('remembered-tenant', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  const withCachedReact = async () => {
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
    return import('./remembered-tenant');
  };

  it('returns the tenant remembered earlier in the same render pass', async () => {
    const { rememberRequestTenantId, getRememberedTenantId } =
      await withCachedReact();

    rememberRequestTenantId('tenant-1');

    expect(getRememberedTenantId()).toBe('tenant-1');
  });

  it('returns undefined when nothing was remembered', async () => {
    const { getRememberedTenantId } = await withCachedReact();

    expect(getRememberedTenantId()).toBeUndefined();
  });

  it('never yields the unresolved-tenant placeholder back, even when seeded with it', async () => {
    const { rememberRequestTenantId, getRememberedTenantId } =
      await withCachedReact();

    rememberRequestTenantId(UNRESOLVED_TENANT_PLACEHOLDER);

    expect(getRememberedTenantId()).toBeUndefined();
  });
});
