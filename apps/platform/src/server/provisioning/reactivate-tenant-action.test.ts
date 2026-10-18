import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
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
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('rejects an empty confirmation without reading the tenant', async () => {
    const result = await reactivateTenantAction('tenant-1', { confirm: '  ' });

    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.CONFIRM_REQUIRED } },
    });
  });

  it("rejects a confirmation that doesn't match the tenant's live name", async () => {
    const result = await reactivateTenantAction('tenant-1', {
      confirm: 'acme',
    });

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
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
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_DEPROVISIONED,
    });
  });

  it('refuses an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await reactivateTenantAction('ghost', { confirm: 'Acme' });

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it.each([
    [
      'already-in-progress',
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ALREADY_IN_PROGRESS,
      },
    ],
    [
      'not-found',
      { outcome: ACTION_OUTCOME.REFUSED, reason: TENANT_REFUSAL.NOT_FOUND },
    ],
    ['dispatch-error', { outcome: ACTION_OUTCOME.SERVER_ERROR }],
  ])(
    'records nothing and refuses when provisioning reports %s',
    async (outcome, expected) => {
      startProvisioningMock.mockResolvedValue({ outcome });

      const result = await reactivateTenantAction('tenant-1', {
        confirm: 'Acme',
      });

      expect(recordAuditEventMock).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    },
  );
});
