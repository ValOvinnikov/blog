import { faker } from '@faker-js/faker';
import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@shinefold/config/constants';
import { insertAuditEvent } from '@shinefold/db/queries/audit-events';
import {
  countTenantReaderData,
  purgeTenantReaderData as purgeReaderDataRows,
} from '@shinefold/db/queries/reader-data';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_AUDIT_DETAILS,
  MOCK_DEPROVISION_DRY_RUN_ENV,
  MOCK_DEPROVISION_ENV,
  MOCK_DEPROVISIONED_AT,
  MOCK_PURGED_READER_DATA_COUNTS,
} from '@shinefold/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@shinefold/db/testing/tenants/fixtures';

import { purgeTenantReaderData } from './purge-reader-data';

vi.mock('@shinefold/db/queries/reader-data');
vi.mock('@shinefold/db/queries/audit-events');

faker.seed(5765);

const MOCK_TENANT = mockTenant({ deprovisionedAt: MOCK_DEPROVISIONED_AT });

beforeEach(() => {
  vi.mocked(countTenantReaderData).mockResolvedValue(
    MOCK_PURGED_READER_DATA_COUNTS,
  );
  vi.mocked(purgeReaderDataRows).mockResolvedValue(
    MOCK_PURGED_READER_DATA_COUNTS,
  );
});

describe(purgeTenantReaderData, () => {
  it("purges the tenant's reader data through the shared purge", async () => {
    await purgeTenantReaderData(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(purgeReaderDataRows).toHaveBeenCalledWith(MOCK_TENANT.id);
  });

  it('records one READER_DATA_PURGED audit event with the purged counts', async () => {
    await purgeTenantReaderData(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(insertAuditEvent).toHaveBeenCalledTimes(1);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT.id,
      details: {
        ...MOCK_DEPROVISION_AUDIT_DETAILS,
        ...MOCK_PURGED_READER_DATA_COUNTS,
      },
    });
  });

  it('only counts, never deletes or audits, in dry-run mode', async () => {
    await purgeTenantReaderData(MOCK_TENANT, MOCK_DEPROVISION_DRY_RUN_ENV);

    expect(countTenantReaderData).toHaveBeenCalledWith(MOCK_TENANT.id);
    expect(purgeReaderDataRows).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });
});
