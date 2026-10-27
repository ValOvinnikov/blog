import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { archiveTenant } from '@blog/db/queries/tenants';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_AUDIT_DETAILS,
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
  MOCK_DEPROVISIONED_AT,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { archiveTenantRow } from './archive-tenant';

vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/audit-events');

faker.seed(5765);

const MOCK_TENANT = mockTenant();

beforeEach(() => {
  vi.mocked(archiveTenant).mockResolvedValue({ ok: true, data: MOCK_TENANT });
});

describe(archiveTenantRow, () => {
  it('archives the tenant row', async () => {
    await archiveTenantRow(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(archiveTenant).toHaveBeenCalledWith(MOCK_TENANT.id);
  });

  it('records one DEPROVISIONED audit event after a successful archive', async () => {
    await archiveTenantRow(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(insertAuditEvent).toHaveBeenCalledTimes(1);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT.id,
      details: MOCK_DEPROVISION_AUDIT_DETAILS,
    });
  });

  it('skips when already deprovisioned', async () => {
    await archiveTenantRow(
      { ...MOCK_TENANT, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      MOCK_DEPROVISION_ENV,
    );

    expect(archiveTenant).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it('neither archives nor records an audit event in dry-run mode', async () => {
    await archiveTenantRow(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(archiveTenant).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });
});
