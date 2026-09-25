import { getRequestTenantId } from './get-request-tenant-id';
import { UNRESOLVED_TENANT_PLACEHOLDER } from './unresolved-tenant-placeholder';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));

const VALID_TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe(getRequestTenantId, () => {
  beforeEach(() => {
    headersMock.mockReset();
  });

  it('returns the resolved tenant id from the x-tenant-id header', async () => {
    headersMock.mockResolvedValue(new Headers({ 'x-tenant-id': 'tenant-1' }));

    await expect(getRequestTenantId()).resolves.toBe('tenant-1');
  });

  it('returns undefined when the header is absent', async () => {
    headersMock.mockResolvedValue(new Headers());

    await expect(getRequestTenantId()).resolves.toBeUndefined();
  });

  it('prefers an explicitly supplied tenant over the header, without reading headers at all', async () => {
    await expect(getRequestTenantId(VALID_TENANT_ID)).resolves.toBe(
      VALID_TENANT_ID,
    );

    expect(headersMock).not.toHaveBeenCalled();
  });

  it('returns undefined for the unresolved-tenant placeholder supplied as the tenant param, without forwarding it as a real id', async () => {
    headersMock.mockResolvedValue(new Headers());

    await expect(
      getRequestTenantId(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBeUndefined();
  });

  it('returns undefined for the unresolved-tenant placeholder read from the header', async () => {
    headersMock.mockResolvedValue(
      new Headers({ 'x-tenant-id': UNRESOLVED_TENANT_PLACEHOLDER }),
    );

    await expect(getRequestTenantId()).resolves.toBeUndefined();
  });

  it('returns undefined for a tenant param that is not tenant-shaped, without reading headers at all', async () => {
    await expect(getRequestTenantId('.well-known')).resolves.toBeUndefined();

    expect(headersMock).not.toHaveBeenCalled();
  });

  it('returns undefined for a tenant param carrying a valid tenant id plus trailing garbage', async () => {
    await expect(
      getRequestTenantId(`${VALID_TENANT_ID}-trailing-garbage`),
    ).resolves.toBeUndefined();
  });
});

describe('getRequestTenantId memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the header read when called more than once in the same render pass', async () => {
    headersMock.mockClear();
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
    headersMock.mockResolvedValue(new Headers({ 'x-tenant-id': 'tenant-1' }));

    const { getRequestTenantId: freshGetRequestTenantId } =
      await import('./get-request-tenant-id');

    await freshGetRequestTenantId();
    await freshGetRequestTenantId();

    expect(headersMock).toHaveBeenCalledTimes(1);
  });
});
