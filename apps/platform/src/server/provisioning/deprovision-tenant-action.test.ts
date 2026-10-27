import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { PROVISIONING_LOG } from '@platform/constants/provisioning';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
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
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { deprovisionTenantAction } from './deprovision-tenant-action';
import { dispatchDeprovisioningWorkflow } from './dispatch-deprovisioning-workflow';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

vi.mock(
  '@platform/server/provisioning/dispatch-deprovisioning-workflow',
  () => ({
    dispatchDeprovisioningWorkflow: vi.fn(),
  }),
);

faker.seed(5997);

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);
const insertAuditEventMock = vi.mocked(queries.auditEvents.insertAuditEvent);
const dispatchMock = vi.mocked(dispatchDeprovisioningWorkflow);
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_WRONG_NAME = faker.lorem.words(3);
const MOCK_CONNECTION_ERROR = new Error(faker.lorem.words(2));

describe(deprovisionTenantAction, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(mockTenant());
    dispatchMock.mockReset();
    dispatchMock.mockResolvedValue(true);
    insertAuditEventMock.mockReset();
  });

  it('stops before any tenant work when the super-admin gate rejects', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      deprovisionTenantAction(MOCK_TENANT_ID, {
        confirm: MOCK_TENANT_NAME,
        dryRun: true,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the tenant name', async () => {
    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_WRONG_NAME,
      dryRun: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('refuses a tenant that is already deprovisioned', async () => {
    getTenantByIdMock.mockResolvedValueOnce(
      mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    );

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_DEPROVISIONED,
    });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('dispatches the deprovisioning workflow when confirm matches the name', async () => {
    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });
  });

  it('records a DEPROVISION_REQUESTED audit event for a real dispatch', async () => {
    await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { name: MOCK_TENANT_NAME },
    });
  });

  it('returns a server error and no audit event when the dispatch fails', async () => {
    dispatchMock.mockResolvedValueOnce(false);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event for a dry run', async () => {
    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: true,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds, and logs the failure, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(MOCK_CONNECTION_ERROR);

    const result = await deprovisionTenantAction(MOCK_TENANT_ID, {
      confirm: MOCK_TENANT_NAME,
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      PROVISIONING_LOG.DEPROVISION_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.DEPROVISION_REQUESTED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        errorName: MOCK_CONNECTION_ERROR.name,
      },
    );
  });
});
