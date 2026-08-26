import { adminRoutes } from '@admin/utils/routes/routes';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { redirect } from 'next/navigation';

const {
  requireSuperAdminMock,
  authMock,
  listTenantsByIdsMock,
  dispatchDeprovisioningWorkflowMock,
  insertAuditEventMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  authMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  dispatchDeprovisioningWorkflowMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('./dispatch-deprovisioning-workflow', () => ({
  dispatchDeprovisioningWorkflow: dispatchDeprovisioningWorkflowMock,
}));

const tenant = {
  id: 'tenant-1',
  slug: 'acme',
  deprovisionedAt: null as Date | null,
};

describe('deprovisionTenantAction', () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    vi.mocked(redirect).mockClear();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    listTenantsByIdsMock.mockReset();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    dispatchDeprovisioningWorkflowMock.mockReset();
    dispatchDeprovisioningWorkflowMock.mockResolvedValue(true);
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('requires a super-admin session before dispatching', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    await expect(
      deprovisionTenantAction('tenant-1', { confirm: 'acme', dryRun: true }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's /unauthorized redirect, before touching the tenant", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      redirect(adminRoutes.unauthorized());
    });
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    await expect(
      deprovisionTenantAction('tenant-1', { confirm: 'acme', dryRun: true }),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith(adminRoutes.unauthorized());
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns a field error when confirm does not match the tenant slug', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'wrong-slug',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is not found', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is already deprovisioned', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      { ...tenant, deprovisionedAt: new Date('2026-01-01T00:00:00.000Z') },
    ]);
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('dispatches the deprovisioning workflow when confirm matches the live slug', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: false,
    });

    expect(result).toEqual({ ok: true });
    expect(dispatchDeprovisioningWorkflowMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: false,
    });
  });

  it('records a DEPROVISIONED audit event for a real (non-dry-run) dispatch', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: false,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: { slug: 'acme' },
    });
  });

  it('returns an error and writes no audit event when the dispatch fails', async () => {
    dispatchDeprovisioningWorkflowMock.mockResolvedValue(false);
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: false,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event for a dry run', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: true,
    });

    expect(result).toEqual({ ok: true });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: false,
    });

    expect(result).toEqual({ ok: true });
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'provisioning.deprovision_audit_failed',
      expect.objectContaining({
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });
});
