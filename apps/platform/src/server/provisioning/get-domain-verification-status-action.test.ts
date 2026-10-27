import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { queries } from '@blog/db';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { requireAdmin } from '@platform/server/auth/require-admin';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { getDomainVerificationStatus } from './get-domain-verification-status';
import { getDomainVerificationStatusAction } from './get-domain-verification-status-action';

vi.mock('@platform/server/auth/require-admin');

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: vi.fn(),
}));

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const getDomainVerificationStatusMock = vi.mocked(getDomainVerificationStatus);

describe(getDomainVerificationStatusAction, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
  });

  it('requires an admin session before doing anything else', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(
      getDomainVerificationStatusAction(MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });

  it("resolves the domain from the tenant's own row, never from the argument", async () => {
    getTenantByIdMock.mockResolvedValueOnce(
      mockTenant({ id: MOCK_TENANT_ID, primaryDomain: MOCK_TENANT_DOMAIN }),
    );
    getDomainVerificationStatusMock.mockResolvedValueOnce(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );

    const result = await getDomainVerificationStatusAction(MOCK_TENANT_ID);

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(getDomainVerificationStatusMock).toHaveBeenCalledOnce();
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_DOMAIN,
    );
    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.VERIFIED);
  });

  it('returns ERROR without checking any domain for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValueOnce(undefined);

    const result =
      await getDomainVerificationStatusAction(MOCK_OTHER_TENANT_ID);

    expect(result).toBe(DOMAIN_VERIFICATION_STATUS.ERROR);
    expect(getDomainVerificationStatusMock).not.toHaveBeenCalled();
  });
});
