import { getRequestTenantId } from './get-request-tenant-id';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));

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
