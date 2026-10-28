import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { errorResult, okResult } from '@blog/utils';
import {
  CUSTOM_DOMAIN_FIELD_ERROR,
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import {
  MOCK_CLAIM_ID,
  MOCK_CLAIM_TOKEN,
  mockCustomDomainClaim,
  mockOwnerContext,
} from '@platform/testing/custom-domain/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { customDomainTxtName } from '@platform/utils/custom-domain-txt-name/custom-domain-txt-name';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { lookupTxtRecords } from './lookup-txt-records';
import { verifyCustomDomainAction } from './verify-custom-domain-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('./lookup-txt-records');

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueWorkerRequest: vi.fn(),
}));

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const { customDomainClaims, tenantDomains } = queries;

const asOwner = (overrides: Partial<TTenant> = {}) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(
      mockOwnerContext({ plan: TENANT_PLAN.GROWTH, ...overrides }),
    );

describe(verifyCustomDomainAction, () => {
  beforeEach(() => {
    vi.mocked(customDomainClaims.getCustomDomainClaim)
      .mockReset()
      .mockResolvedValue(mockCustomDomainClaim());
    vi.mocked(customDomainClaims.promoteCustomDomainClaim)
      .mockReset()
      .mockResolvedValue(okResult({} as never));
    vi.mocked(tenantDomains.removeTenantDomain)
      .mockReset()
      .mockResolvedValue(true);
    vi.mocked(lookupTxtRecords)
      .mockReset()
      .mockResolvedValue([MOCK_CLAIM_TOKEN]);
    vi.mocked(enqueueWorkerRequest)
      .mockReset()
      .mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(verifyCustomDomainAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(lookupTxtRecords).not.toHaveBeenCalled();
  });

  it('rejects a member who is not the owner', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    await expect(verifyCustomDomainAction(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(customDomainClaims.promoteCustomDomainClaim).not.toHaveBeenCalled();
  });

  it('refuses when the site has no claim', async () => {
    asOwner();
    vi.mocked(customDomainClaims.getCustomDomainClaim).mockResolvedValue(
      undefined,
    );

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM,
    });
    expect(lookupTxtRecords).not.toHaveBeenCalled();
  });

  it('reports the record as not found yet without logging or promoting', async () => {
    asOwner();
    vi.mocked(lookupTxtRecords).mockResolvedValue(['someone-else']);

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.RECORD_NOT_FOUND,
    });
    expect(lookupTxtRecords).toHaveBeenCalledWith(
      customDomainTxtName(MOCK_CUSTOM_DOMAIN),
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(customDomainClaims.promoteCustomDomainClaim).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('promotes the claim, asks the worker to connect it and audits it on a match', async () => {
    asOwner();

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(customDomainClaims.promoteCustomDomainClaim).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CLAIM_ID,
    );
    expect(enqueueWorkerRequest).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_PATH.CONNECT,
      { tenantId: MOCK_TENANT_ID, domain: MOCK_CUSTOM_DOMAIN },
    );
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: CUSTOM_DOMAIN_LOG.VERIFY_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { customDomainConnectRequested: MOCK_CUSTOM_DOMAIN },
    });
  });

  it('reports a domain verified first by another site as taken', async () => {
    asOwner();
    vi.mocked(customDomainClaims.promoteCustomDomainClaim).mockResolvedValue(
      errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN),
    );

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        domain: { reason: CUSTOM_DOMAIN_FIELD_ERROR.DOMAIN_TAKEN },
      },
    });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('refuses when the claim was removed before it could be promoted', async () => {
    asOwner();
    vi.mocked(customDomainClaims.promoteCustomDomainClaim).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NO_PENDING_CLAIM,
    });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('logs and reports a server error when the lookup fails', async () => {
    asOwner();
    const failure = new Error('timed out');
    vi.mocked(lookupTxtRecords).mockRejectedValue(failure);

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.VERIFY_LOOKUP_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
      }),
    );
    expect(customDomainClaims.promoteCustomDomainClaim).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    ['a rejected response', HTTP_STATUS.INTERNAL_SERVER_ERROR],
    ['no response', null],
  ])(
    'removes the promoted domain, reports a server error and records nothing on %s from the worker',
    async (_name, status) => {
      asOwner();
      vi.mocked(enqueueWorkerRequest).mockResolvedValue(status);

      const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
      expect(tenantDomains.removeTenantDomain).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_CUSTOM_DOMAIN,
      );
      expect(recordAuditEvent).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['an archived site', { deprovisionedAt: new Date() }],
    ['a Free site', { plan: TENANT_PLAN.FREE }],
  ])('refuses %s without looking anything up', async (_name, overrides) => {
    asOwner(overrides);

    const result = await verifyCustomDomainAction(MOCK_TENANT_ID);

    expect(result.outcome).toBe(ACTION_OUTCOME.REFUSED);
    expect(lookupTxtRecords).not.toHaveBeenCalled();
  });
});
