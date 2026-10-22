import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const {
  requireSuperAdminMock,
  getTenantByIdMock,
  dispatchDeprovisioningWorkflowMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  dispatchDeprovisioningWorkflowMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('./dispatch-deprovisioning-workflow', () => ({
  dispatchDeprovisioningWorkflow: dispatchDeprovisioningWorkflowMock,
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);

const tenant = {
  id: TENANT_ID,
  name: 'Acme Inc.',
  deprovisionedAt: null as Date | null,
};

describe('deprovisionTenantAction', () => {
  let deprovisionTenantAction: (typeof import('./deprovision-tenant-action'))['deprovisionTenantAction'];

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(tenant);
    dispatchDeprovisioningWorkflowMock.mockReset();
    dispatchDeprovisioningWorkflowMock.mockResolvedValue(true);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    ({ deprovisionTenantAction } = await import('./deprovision-tenant-action'));
  });

  it('requires a super-admin session before dispatching', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });
    await expect(
      deprovisionTenantAction(TENANT_ID, {
        confirm: 'Acme Inc.',
        dryRun: true,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's 404 before any tenant work", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });
    await expect(
      deprovisionTenantAction(TENANT_ID, {
        confirm: 'Acme Inc.',
        dryRun: true,
      }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(redirect).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns a field error when confirm does not match the tenant name', async () => {
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'wrong-name',
      dryRun: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is not found', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is already deprovisioned', async () => {
    getTenantByIdMock.mockResolvedValue({
      ...tenant,
      deprovisionedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: true,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ALREADY_DEPROVISIONED,
    });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('dispatches the deprovisioning workflow when confirm matches the live name', async () => {
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchDeprovisioningWorkflowMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      confirm: 'Acme Inc.',
      dryRun: false,
    });
  });

  it('records a DEPROVISION_REQUESTED audit event for a real (non-dry-run) dispatch', async () => {
    await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: false,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.DEPROVISION_REQUESTED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: TENANT_ID,
      details: { name: 'Acme Inc.' },
    });
  });

  it('returns an error and writes no audit event when the dispatch fails', async () => {
    dispatchDeprovisioningWorkflowMock.mockResolvedValue(false);
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event for a dry run', async () => {
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: true,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const result = await deprovisionTenantAction(TENANT_ID, {
      confirm: 'Acme Inc.',
      dryRun: false,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'provisioning.deprovision_audit_failed',
      expect.objectContaining({
        targetId: TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });
});
