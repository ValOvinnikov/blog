import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant, TENANT_ID } from '@platform/testing/tenants/fixtures';

const { requireAdminMock, getTenantByIdMock, getDomainVerificationStatusMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getDomainVerificationStatusMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { getTenantById: getTenantByIdMock } },
}));

vi.mock('./get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

const ACME_EXAMPLE_COM = 'acme.example.com';

describe('getDomainVerificationStatusAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    getTenantByIdMock.mockReset();
    getDomainVerificationStatusMock.mockReset();
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    await expect(getDomainVerificationStatusAction(TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it("resolves the domain from the tenant's own database row, never from the caller's argument", async () => {
    getTenantByIdMock.mockResolvedValue(
      makeTenant({ id: TENANT_ID, primaryDomain: ACME_EXAMPLE_COM }),
    );
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    const result = await getDomainVerificationStatusAction(TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(TENANT_ID, {
      includeArchived: true,
    });
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      ACME_EXAMPLE_COM,
    );
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalledWith(TENANT_ID);
    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });

  it('returns ERROR without checking any domain when the tenant id resolves to no row', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    const result = await getDomainVerificationStatusAction('unknown-tenant');

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });
});
