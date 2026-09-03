import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { notFound } from 'next/navigation';

const {
  requireSuperAdminMock,
  dispatchProvisioningWorkflowMock,
  getTenantByIdMock,
  beginTenantProvisioningMock,
  setTenantProvisioningStatusMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  dispatchProvisioningWorkflowMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  beginTenantProvisioningMock: vi.fn(),
  setTenantProvisioningStatusMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('./dispatch-provisioning-workflow', () => ({
  dispatchProvisioningWorkflow: dispatchProvisioningWorkflowMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      beginTenantProvisioning: beginTenantProvisioningMock,
      setTenantProvisioningStatus: setTenantProvisioningStatusMock,
    },
  },
}));

const ARCHIVED_TENANT = {
  id: 'tenant-1',
  name: 'Acme',
  deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
};

describe('reactivateTenantAction', () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    dispatchProvisioningWorkflowMock.mockReset();
    dispatchProvisioningWorkflowMock.mockResolvedValue(true);
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(ARCHIVED_TENANT);
    beginTenantProvisioningMock.mockReset();
    beginTenantProvisioningMock.mockResolvedValue({
      ok: true,
      data: {
        tenant: ARCHIVED_TENANT,
        previousProvisioningStatus: 'READY',
      },
    });
    setTenantProvisioningStatusMock.mockReset();
    setTenantProvisioningStatusMock.mockResolvedValue({
      ok: true,
      data: ARCHIVED_TENANT,
    });
    recordAuditEventMock.mockReset();
    recordAuditEventMock.mockResolvedValue(undefined);
  });

  it('requires a super-admin session before reading the tenant', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    await expect(
      reactivateTenantAction('tenant-1', { confirm: 'Acme' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('dispatches the provisioning workflow and records a REACTIVATED audit event', async () => {
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1', {
      includeArchived: true,
    });
    expect(beginTenantProvisioningMock).toHaveBeenCalledWith('tenant-1');
    expect(dispatchProvisioningWorkflowMock).toHaveBeenCalledWith('tenant-1');
    expect(setTenantProvisioningStatusMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.REACTIVATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: 'tenant-1',
        details: { name: 'Acme' },
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('rejects an empty confirmation without reading the tenant', async () => {
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', { confirm: '  ' });

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Type the tenant name to confirm.',
    });
  });

  it("rejects a confirmation that doesn't match the tenant's live name", async () => {
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'acme',
    });

    expect(beginTenantProvisioningMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: "Doesn't match the tenant's name.",
    });
  });

  it('refuses a tenant that is not deprovisioned', async () => {
    getTenantByIdMock.mockResolvedValue({
      ...ARCHIVED_TENANT,
      deprovisionedAt: null,
    });
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(beginTenantProvisioningMock).not.toHaveBeenCalled();
    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'This tenant is not deprovisioned.',
    });
  });

  it('refuses an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('ghost', { confirm: 'Acme' });

    expect(beginTenantProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'Tenant not found.' });
  });

  it('refuses without dispatching when a provisioning run is already in flight', async () => {
    beginTenantProvisioningMock.mockResolvedValue({
      ok: false,
      error: 'DB_ALREADY_PROVISIONING',
    });
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(dispatchProvisioningWorkflowMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Provisioning is already running.',
    });
  });

  it('reverts the PROVISIONING transition and records nothing when the dispatch fails', async () => {
    dispatchProvisioningWorkflowMock.mockResolvedValue(false);
    const { reactivateTenantAction } =
      await import('./reactivate-tenant-action');

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(setTenantProvisioningStatusMock).toHaveBeenCalledWith(
      'tenant-1',
      'READY',
    );
    expect(recordAuditEventMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: "Couldn't start reactivation — try again.",
    });
  });
});
