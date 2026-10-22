import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  TENANT_DELETE_OUTCOME,
  TENANT_DELETE_SANITY_PROJECT_OUTCOME,
  type TMaybeNull,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { auth } from '@platform/server/auth/auth';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { logger } from '@platform/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const {
  requireSuperAdminMock,
  getTenantByIdMock,
  deleteTenantMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  deleteTenantMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      deleteTenant: deleteTenantMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);

const CONNECTION_ERROR_MESSAGE = 'connection reset';

const tenant = {
  id: 'tenant-1',
  name: 'Acme Inc.',
  deprovisionedAt: new Date('2026-01-01T00:00:00.000Z') as TMaybeNull<Date>,
};

describe('deleteTenantAction', () => {
  let deleteTenantAction: (typeof import('./delete-tenant-action'))['deleteTenantAction'];

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
    deleteTenantMock.mockReset();
    deleteTenantMock.mockResolvedValue({
      outcome: TENANT_DELETE_OUTCOME.DELETED,
      sanityProject: TENANT_DELETE_SANITY_PROJECT_OUTCOME.NO_PROJECT,
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    ({ deleteTenantAction } = await import('./delete-tenant-action'));
  });

  it('requires a super-admin session before deleting', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });
    await expect(
      deleteTenantAction('tenant-1', { confirm: 'Acme Inc.' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's 404 before any tenant work", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });
    await expect(
      deleteTenantAction('tenant-1', { confirm: 'Acme Inc.' }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(redirect).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is not found', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error when confirm does not match the tenant name', async () => {
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'wrong-name',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error and no audit event when the mutation refuses a live tenant', async () => {
    deleteTenantMock.mockResolvedValue({
      outcome: TENANT_DELETE_OUTCOME.NOT_ARCHIVED,
    });
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_ARCHIVED,
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns an error and no audit event when the mutation reports the tenant gone', async () => {
    deleteTenantMock.mockResolvedValue({
      outcome: TENANT_DELETE_OUTCOME.NOT_FOUND,
    });
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('deletes the tenant and records a DELETED audit event when confirm matches', async () => {
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(deleteTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.DELETED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: { name: 'Acme Inc.' },
    });
  });

  it('returns an error and records no audit event when the delete mutation throws', async () => {
    deleteTenantMock.mockRejectedValue(new Error(CONNECTION_ERROR_MESSAGE));
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.delete_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error(CONNECTION_ERROR_MESSAGE));
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.delete_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });
});
