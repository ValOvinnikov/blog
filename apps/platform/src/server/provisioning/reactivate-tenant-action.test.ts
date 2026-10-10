import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { notFound } from 'next/navigation';

const {
  requireSuperAdminMock,
  startProvisioningMock,
  getTenantByIdMock,
  recordAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  startProvisioningMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('./start-provisioning', () => ({
  startProvisioning: startProvisioningMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
    },
  },
}));

const ARCHIVED_TENANT = {
  id: 'tenant-1',
  name: 'Acme',
  deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
};

describe('reactivateTenantAction', () => {
  let reactivateTenantAction: typeof import('./reactivate-tenant-action').reactivateTenantAction;

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    startProvisioningMock.mockReset();
    startProvisioningMock.mockResolvedValue({ outcome: 'dispatched' });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(ARCHIVED_TENANT);
    recordAuditEventMock.mockReset();
    recordAuditEventMock.mockResolvedValue(undefined);
    ({ reactivateTenantAction } = await import('./reactivate-tenant-action'));
  });

  it('requires a super-admin session before reading the tenant', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(
      reactivateTenantAction('tenant-1', { confirm: 'Acme' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it('starts provisioning and records a REACTIVATED audit event', async () => {
    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1', {
      includeArchived: true,
    });
    expect(startProvisioningMock).toHaveBeenCalledWith('tenant-1');
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
    const result = await reactivateTenantAction('tenant-1', { confirm: '  ' });

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'Type the tenant name to confirm.',
    });
  });

  it("rejects a confirmation that doesn't match the tenant's live name", async () => {
    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'acme',
    });

    expect(startProvisioningMock).not.toHaveBeenCalled();
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

    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'Acme',
    });

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      error: 'This tenant is not deprovisioned.',
    });
  });

  it('refuses an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await reactivateTenantAction('ghost', { confirm: 'Acme' });

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'Tenant not found.' });
  });

  it.each([
    ['already-in-progress', 'Provisioning is already running.'],
    ['not-found', 'Tenant not found.'],
    ['dispatch-error', "Couldn't start reactivation — try again."],
  ])(
    'records nothing and refuses when provisioning reports %s',
    async (outcome, error) => {
      startProvisioningMock.mockResolvedValue({ outcome });

      const result = await reactivateTenantAction('tenant-1', {
        confirm: 'Acme',
      });

      expect(recordAuditEventMock).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error });
    },
  );
});
