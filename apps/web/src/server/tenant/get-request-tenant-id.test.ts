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
