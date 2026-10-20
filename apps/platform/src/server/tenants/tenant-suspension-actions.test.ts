import { ACTION_OUTCOME, AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound } from 'next/navigation';

const {
  requireSuperAdminMock,
  getTenantByIdMock,
  setTenantSuspensionMock,
  recordAuditEventMock,
  revalidateSiteConfigMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  setTenantSuspensionMock: vi.fn(),
  recordAuditEventMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/audit/record-audit-event', () => ({
  recordAuditEvent: recordAuditEventMock,
}));

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      setTenantSuspension: setTenantSuspensionMock,
    },
  },
}));

const ACTIVE_TENANT = {
  id: 'tenant-1',
  name: 'Acme',
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
};

describe('tenant suspension actions', () => {
  let actions: typeof import('./tenant-suspension-actions');

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({ id: 'admin-1' });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(ACTIVE_TENANT);
    setTenantSuspensionMock.mockReset();
    setTenantSuspensionMock.mockResolvedValue({ ok: true, data: {} });
    recordAuditEventMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    actions = await import('./tenant-suspension-actions');
  });

  it('requires a super-admin session before reading the tenant', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(actions.suspendTenantAction('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(getTenantByIdMock).not.toHaveBeenCalled();
    expect(setTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it('suspends the tenant, purges its cached site and records the operator action', async () => {
    const result = await actions.suspendTenantAction('tenant-1');

    expect(setTenantSuspensionMock).toHaveBeenCalledWith(
      'tenant-1',
      TENANT_STATUS.SUSPENDED,
    );
    expect(revalidateSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(recordAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.SUSPENSION_APPLIED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: 'tenant-1',
        details: { name: 'Acme' },
      }),
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('reactivates a suspended tenant and records the lifted suspension', async () => {
    getTenantByIdMock.mockResolvedValue({
      ...ACTIVE_TENANT,
      status: TENANT_STATUS.SUSPENDED,
    });

    const result = await actions.liftTenantSuspensionAction('tenant-1');

    expect(setTenantSuspensionMock).toHaveBeenCalledWith(
      'tenant-1',
      TENANT_STATUS.ACTIVE,
    );
    expect(revalidateSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(recordAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: AUDIT_ACTION.SUSPENSION_LIFTED }),
    );
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an unknown tenant', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await actions.suspendTenantAction('tenant-1');

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
    expect(setTenantSuspensionMock).not.toHaveBeenCalled();
  });

  it.each([
    { status: TENANT_STATUS.ARCHIVED, deprovisionedAt: null },
    {
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: new Date('2026-08-26T00:00:00Z'),
    },
  ])(
    'refuses an archived tenant ($status, deprovisionedAt $deprovisionedAt)',
    async (archived) => {
      getTenantByIdMock.mockResolvedValue({ ...ACTIVE_TENANT, ...archived });

      const result = await actions.liftTenantSuspensionAction('tenant-1');

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: TENANT_REFUSAL.ARCHIVED,
      });
      expect(setTenantSuspensionMock).not.toHaveBeenCalled();
      expect(recordAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it('refuses when the tenant is archived before the write lands', async () => {
    setTenantSuspensionMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    const result = await actions.suspendTenantAction('tenant-1');

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.ARCHIVED,
    });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns a server error without an audit event when the write throws', async () => {
    setTenantSuspensionMock.mockRejectedValue(new Error('db down'));

    const result = await actions.suspendTenantAction('tenant-1');

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(recordAuditEventMock).not.toHaveBeenCalled();
  });
});
