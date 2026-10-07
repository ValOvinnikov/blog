import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { logger } from '@platform/utils/logger/logger';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

const {
  requireSuperAdminMock,
  listTenantsByIdsMock,
  deleteTenantMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  deleteTenantMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/logger/logger');

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      listTenantsByIds: listTenantsByIdsMock,
      deleteTenant: deleteTenantMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);

const tenant = {
  id: 'tenant-1',
  name: 'Acme Inc.',
  deprovisionedAt: new Date('2026-01-01T00:00:00.000Z') as Date | null,
};

describe('deleteTenantAction', () => {
  let deleteTenantAction: (typeof import('./delete-tenant-action'))['deleteTenantAction'];

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    listTenantsByIdsMock.mockReset();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    deleteTenantMock.mockReset();
    deleteTenantMock.mockResolvedValue({ outcome: 'deleted' });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    ({ deleteTenantAction } = await import('./delete-tenant-action'));
  });

  it('requires a super-admin session before deleting', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    await expect(
      deleteTenantAction('tenant-1', { confirm: 'Acme Inc.' }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's 404 before any tenant work", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });
    await expect(
      deleteTenantAction('tenant-1', { confirm: 'Acme Inc.' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is not found', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error when confirm does not match the tenant name', async () => {
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'wrong-name',
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(deleteTenantMock).not.toHaveBeenCalled();
  });

  it('returns an error and no audit event when the mutation refuses a live tenant', async () => {
    deleteTenantMock.mockResolvedValue({ outcome: 'not-archived' });
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns an error and no audit event when the mutation reports the tenant gone', async () => {
    deleteTenantMock.mockResolvedValue({ outcome: 'not-found' });
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('deletes the tenant and records a DELETED audit event when confirm matches', async () => {
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: true });
    expect(deleteTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.DELETED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: { name: 'Acme Inc.' },
    });
  });

  it('returns an error and records no audit event when the delete mutation throws', async () => {
    deleteTenantMock.mockRejectedValue(new Error('connection reset'));
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
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
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const result = await deleteTenantAction('tenant-1', {
      confirm: 'Acme Inc.',
    });

    expect(result).toEqual({ ok: true });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'tenants.delete_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });
});
