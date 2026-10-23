import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenant,
  MOCK_TENANT_ID,
  MOCK_TENANT_DOMAIN,
} from '@platform/testing/tenants/fixtures';

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

    await expect(
      getDomainVerificationStatusAction(MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it("resolves the domain from the tenant's own database row, never from the caller's argument", async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ id: MOCK_TENANT_ID, primaryDomain: MOCK_TENANT_DOMAIN }),
    );
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    const { getDomainVerificationStatusAction } =
      await import('./get-domain-verification-status-action');

    const result = await getDomainVerificationStatusAction(MOCK_TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_DOMAIN,
    );
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
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
