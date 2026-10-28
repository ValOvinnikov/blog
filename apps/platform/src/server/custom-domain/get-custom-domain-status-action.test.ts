import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { queries } from '@blog/db';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import {
  mockOwnerContext,
  mockTenantDomainRows,
} from '@platform/testing/custom-domain/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { notFound } from 'next/navigation';

import { getCustomDomainStatusAction } from './get-custom-domain-status-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: vi.fn(),
}));

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const listTenantDomainsMock = vi.mocked(
  queries.tenantDomains.listTenantDomains,
);

describe(getCustomDomainStatusAction, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    listTenantDomainsMock.mockReset().mockResolvedValue(mockTenantDomainRows());
    vi.mocked(requireTenantMembership).mockResolvedValueOnce(
      mockOwnerContext(),
    );
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockImplementationOnce(() => {
        notFound();
      });

    await expect(getCustomDomainStatusAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(getDomainVerificationStatus).not.toHaveBeenCalled();
  });

  it('returns the verification status of the custom domain', async () => {
    vi.mocked(getDomainVerificationStatus).mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.PENDING,
    );

    const status = await getCustomDomainStatusAction(MOCK_TENANT_ID);

    expect(status).toBe(DOMAIN_VERIFICATION_STATUS.PENDING);
    expect(getDomainVerificationStatus).toHaveBeenCalledWith(
      MOCK_CUSTOM_DOMAIN,
    );
  });

  it('reports the domain as not added when the tenant has no custom domain', async () => {
    listTenantDomainsMock.mockResolvedValue([
      { domain: MOCK_TENANT_DOMAIN },
    ] as never);

    const status = await getCustomDomainStatusAction(MOCK_TENANT_ID);

    expect(status).toBe(DOMAIN_VERIFICATION_STATUS.NOT_ADDED);
    expect(getDomainVerificationStatus).not.toHaveBeenCalled();
  });
});
