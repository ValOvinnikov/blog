import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  CUSTOM_DOMAIN_LOG,
  CUSTOM_DOMAIN_PATH,
  CUSTOM_DOMAIN_REFUSAL,
} from '@platform/constants/custom-domain';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import {
  mockOwnerContext,
  mockTenantDomainRows,
} from '@platform/testing/custom-domain/fixtures';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { removeCustomDomainAction } from './remove-custom-domain-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueWorkerRequest: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => {
  const { mockCustomDomainDb } =
    await import('@platform/testing/custom-domain/fixtures');
  return mockCustomDomainDb();
});

const { tenantDomains } = queries;

const MOCK_INPUT = { domain: MOCK_CUSTOM_DOMAIN };

const remove = (input = MOCK_INPUT) =>
  removeCustomDomainAction(MOCK_TENANT_ID, input);

const asTenant = (overrides: Partial<TTenant>) =>
  vi
    .mocked(requireTenantMembership)
    .mockResolvedValueOnce(mockOwnerContext(overrides));

describe(removeCustomDomainAction, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockOwnerContext());
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue(mockTenantDomainRows());
    vi.mocked(tenantDomains.removeTenantDomain)
      .mockReset()
      .mockResolvedValue(true);
    vi.mocked(tenantDomains.addTenantDomain)
      .mockReset()
      .mockResolvedValue({ ok: true, data: {} } as never);
    vi.mocked(enqueueWorkerRequest)
      .mockReset()
      .mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it.each([
    [
      'a caller without access to the tenant',
      () =>
        vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
          notFound();
        }),
    ],
    [
      'a member who is not the owner',
      () =>
        vi.mocked(requireTenantMembership).mockResolvedValueOnce({
          tenant: mockReadyTenant({ id: MOCK_TENANT_ID }),
          membership: mockMembership({ role: MEMBERSHIP_ROLE.READER }),
        }),
    ],
  ])('rejects %s', async (_name, arrange) => {
    arrange();

    await expect(remove()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('deletes the domain, asks the worker to disconnect it, and audits it', async () => {
    const result = await remove();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenantDomains.removeTenantDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(enqueueWorkerRequest).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_PATH.DISCONNECT,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
      },
    );
    expect(recordAuditEvent).toHaveBeenCalledWith({
      logEvent: CUSTOM_DOMAIN_LOG.DISCONNECT_AUDIT_FAILED,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { customDomainRemoved: MOCK_CUSTOM_DOMAIN },
    });
  });

  it('restores the domain and reports a server error on a rejected disconnect', async () => {
    vi.mocked(enqueueWorkerRequest).mockResolvedValue(null);

    const result = await remove();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(tenantDomains.addTenantDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.DISCONNECT_REJECTED_RESTORING,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        responseStatus: null,
      },
    );
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('logs and reports a server error when putting the domain back fails', async () => {
    vi.mocked(enqueueWorkerRequest).mockResolvedValue(null);
    vi.mocked(tenantDomains.addTenantDomain).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
    } as never);

    const result = await remove();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.DISCONNECT_RESTORE_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        domain: MOCK_CUSTOM_DOMAIN,
        error: ERROR_CODE.DB_DUPLICATE_DOMAIN,
      },
    );
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('reports input that is not a domain without removing anything', async () => {
    const result = await remove({ domain: 'not a domain' });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it.each([
    [
      'the main address',
      { primaryDomain: MOCK_CUSTOM_DOMAIN },
      { domain: MOCK_CUSTOM_DOMAIN },
    ],
    [
      'a domain that is not the tenant custom domain',
      {},
      { domain: MOCK_TENANT_DOMAIN },
    ],
  ])('refuses to remove %s', async (_name, overrides, input) => {
    asTenant(overrides);

    const result = await remove(input);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN,
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('refuses an archived tenant', async () => {
    asTenant({ deprovisionedAt: new Date() });

    const result = await remove();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it('reports a server error and records nothing when the delete throws', async () => {
    vi.mocked(tenantDomains.removeTenantDomain).mockRejectedValue(
      new Error('db down'),
    );

    const result = await remove();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
