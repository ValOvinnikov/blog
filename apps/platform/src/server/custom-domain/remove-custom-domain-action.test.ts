import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
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
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';
import { notFound } from 'next/navigation';

import { removeCustomDomainAction } from './remove-custom-domain-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@platform/server/provisioning/enqueue-provisioning', () => ({
  enqueueWorkerRequest: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: {
      listTenantDomains: vi.fn(),
      removeTenantDomain: vi.fn(),
    },
  },
}));

const { tenantDomains } = queries;
const envMock: Partial<Record<keyof typeof env, string>> = env;

const MOCK_INPUT = { domain: MOCK_CUSTOM_DOMAIN };

const asMember = (overrides: Partial<TTenant> = {}) =>
  vi.mocked(requireTenantMembership).mockResolvedValueOnce({
    tenant: mockReadyTenant({
      id: MOCK_TENANT_ID,
      primaryDomain: MOCK_TENANT_DOMAIN,
      ...overrides,
    }),
    membership: mockMembership(),
  });

describe(removeCustomDomainAction, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.mocked(tenantDomains.listTenantDomains)
      .mockReset()
      .mockResolvedValue([
        { domain: MOCK_TENANT_DOMAIN },
        { domain: MOCK_CUSTOM_DOMAIN },
      ] as never);
    vi.mocked(tenantDomains.removeTenantDomain)
      .mockReset()
      .mockResolvedValue(true);
    vi.mocked(enqueueWorkerRequest)
      .mockReset()
      .mockResolvedValue(HTTP_STATUS.ACCEPTED);
  });

  it('rejects a caller without access to the tenant', async () => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      notFound();
    });

    await expect(
      removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it('refuses a member who is not the owner', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.READER }),
    });

    await expect(
      removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('deletes the domain, asks the worker to disconnect it, and audits the removal', async () => {
    asMember();

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(tenantDomains.removeTenantDomain).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(enqueueWorkerRequest).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_PATH.DISCONNECT,
      MOCK_TENANT_ID,
      MOCK_CUSTOM_DOMAIN,
    );
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        details: {
          customDomainRemoved: MOCK_CUSTOM_DOMAIN,
          isDisconnectAccepted: true,
        },
      }),
    );
  });

  it('keeps the removal and logs when the worker does not accept the disconnect', async () => {
    asMember();
    vi.mocked(enqueueWorkerRequest).mockResolvedValue(null);

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.error).toHaveBeenCalledWith(
      CUSTOM_DOMAIN_LOG.DISCONNECT_ENQUEUE_REJECTED,
      expect.objectContaining({ responseStatus: null }),
    );
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          customDomainRemoved: MOCK_CUSTOM_DOMAIN,
          isDisconnectAccepted: false,
        },
      }),
    );
  });

  it('reports input that is not a domain without removing anything', async () => {
    asMember();

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, {
      domain: 'not a domain',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it('refuses to remove the main address', async () => {
    asMember({ primaryDomain: MOCK_CUSTOM_DOMAIN });

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN,
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it('refuses a domain that is not the tenant custom domain', async () => {
    asMember();

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, {
      domain: MOCK_TENANT_DOMAIN,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.NOT_CUSTOM_DOMAIN,
    });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
  });

  it('refuses an archived tenant', async () => {
    asMember({ deprovisionedAt: new Date() });

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: CUSTOM_DOMAIN_REFUSAL.ARCHIVED,
    });
    expect(tenantDomains.removeTenantDomain).not.toHaveBeenCalled();
  });

  it('reports a server error and records nothing when the delete throws', async () => {
    asMember();
    vi.mocked(tenantDomains.removeTenantDomain).mockRejectedValue(
      new Error('db down'),
    );

    const result = await removeCustomDomainAction(MOCK_TENANT_ID, MOCK_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(enqueueWorkerRequest).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
