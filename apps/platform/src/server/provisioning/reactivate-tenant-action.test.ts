import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { startProvisioning } from '@platform/server/provisioning/start-provisioning';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

import { reactivateTenantAction } from './reactivate-tenant-action';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/provisioning/start-provisioning');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const insertAuditEventMock = vi.mocked(queries.auditEvents.insertAuditEvent);
const startProvisioningMock = vi.mocked(startProvisioning);

const MOCK_BLANK_CONFIRM = '  ';

describe(reactivateTenantAction, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );
    insertAuditEventMock.mockReset();
  });

  it('stops before reading the tenant when the super-admin gate rejects', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      reactivateTenantAction(MOCK_TENANT_ID, { confirm: MOCK_TENANT_NAME }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it('starts provisioning and records a REACTIVATED audit event', async () => {
    const result = await reactivateTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(startProvisioningMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.REACTIVATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { name: MOCK_TENANT_NAME },
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('rejects an empty confirmation without reading the tenant', async () => {
    const result = await reactivateTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_BLANK_CONFIRM,
    });

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.CONFIRM_REQUIRED } },
    });
  });

  it('refuses a tenant that is not deprovisioned', async () => {
    getTenantByIdMock.mockResolvedValueOnce(mockTenant());

    const result = await reactivateTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
    });

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_DEPROVISIONED,
    });
  });

  it.each([
    {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
    },
    { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
    { outcome: ACTION_OUTCOME.SERVER_ERROR },
  ] as const)(
    'records nothing and returns the provisioning result %o',
    async (started) => {
      startProvisioningMock.mockResolvedValueOnce(started);

      const result = await reactivateTenantAction(MOCK_TENANT_ID, {
        confirm: MOCK_TENANT_NAME,
      });

      expect(insertAuditEventMock).not.toHaveBeenCalled();
      expect(result).toEqual(started);
    },
  );
});
