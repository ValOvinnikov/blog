import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import { archiveTenantRow } from './archive-tenant';

const { archiveTenantMock, insertAuditEventMock } = vi.hoisted(() => ({
  archiveTenantMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  archiveTenant: archiveTenantMock,
}));

vi.mock('@blog/db/queries/audit-events', () => ({
  insertAuditEvent: insertAuditEventMock,
}));

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  archiveTenantMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: MOCK_TENANT });
  insertAuditEventMock.mockReset().mockResolvedValue({});
});

describe(archiveTenantRow, () => {
  it('archives the tenant row', async () => {
    await archiveTenantRow(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(archiveTenantMock).toHaveBeenCalledWith(MOCK_TENANT.id);
  });

  it('records one DEPROVISIONED audit event for the tenant after a successful archive', async () => {
    await archiveTenantRow(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT.id,
      details: {
        via: 'deprovision-tenant-workflow',
        runId: MOCK_DEPROVISION_ENV.githubRunId,
      },
    });
  });

  it('skips when already deprovisioned', async () => {
    await archiveTenantRow(
      { ...MOCK_TENANT, deprovisionedAt: new Date() },
      MOCK_DEPROVISION_ENV,
    );

    expect(archiveTenantMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('does not write to the row or record an audit event in dry-run mode', async () => {
    await archiveTenantRow(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(archiveTenantMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });
});
