import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';

const {
  requireAdminMock,
  listTenantsByIdsMock,
  getDomainVerificationStatusMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenantsByIds: listTenantsByIdsMock } },
}));

vi.mock('./get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

describe('getDomainVerificationStatusAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    listTenantsByIdsMock.mockReset();
    getDomainVerificationStatusMock.mockReset();
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    await expect(getDomainVerificationStatusAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it("resolves the domain from the tenant's own database row, never from the caller's argument", async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ id: 'tenant-1', primaryDomain: 'acme.example.com' }),
    ]);
    getDomainVerificationStatusMock.mockResolvedValue('VERIFIED');
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    const result = await getDomainVerificationStatusAction('tenant-1');

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    // The underlying check is called with the tenant's own stored domain —
    // the action's own argument (a tenant id, not a domain) never reaches it.
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(result).toBe('VERIFIED');
  });

  it('returns ERROR without checking any domain when the tenant id resolves to no row', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    const result = await getDomainVerificationStatusAction('unknown-tenant');

    expect(result).toBe('ERROR');
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });
});
