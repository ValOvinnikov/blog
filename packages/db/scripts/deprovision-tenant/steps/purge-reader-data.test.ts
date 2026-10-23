import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_ENV,
  MOCK_PURGED_READER_DATA_COUNTS,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';

import { purgeTenantReaderData } from './purge-reader-data';

const {
  countTenantReaderDataMock,
  purgeTenantReaderDataMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  countTenantReaderDataMock: vi.fn(),
  purgeTenantReaderDataMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/reader-data', () => ({
  countTenantReaderData: countTenantReaderDataMock,
  purgeTenantReaderData: purgeTenantReaderDataMock,
}));

vi.mock('@blog/db/queries/audit-events', () => ({
  insertAuditEvent: insertAuditEventMock,
}));

const MOCK_TENANT = mockTenant({ deprovisionedAt: new Date() });

beforeEach(() => {
  countTenantReaderDataMock
    .mockReset()
    .mockResolvedValue(MOCK_PURGED_READER_DATA_COUNTS);
  purgeTenantReaderDataMock
    .mockReset()
    .mockResolvedValue(MOCK_PURGED_READER_DATA_COUNTS);
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(purgeTenantReaderData, () => {
  it("purges the tenant's reader data through the shared purge", async () => {
    await purgeTenantReaderData(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(purgeTenantReaderDataMock).toHaveBeenCalledWith(MOCK_TENANT.id);
  });

  it('records one READER_DATA_PURGED audit event carrying the purged per-table counts', async () => {
    await purgeTenantReaderData(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT.id,
      details: {
        via: 'deprovision-tenant-workflow',
        runId: MOCK_DEPROVISION_ENV.githubRunId,
        ...MOCK_PURGED_READER_DATA_COUNTS,
      },
    });
  });

  it('only counts, never deletes, and records no audit event in dry-run mode', async () => {
    await purgeTenantReaderData(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(countTenantReaderDataMock).toHaveBeenCalledWith(MOCK_TENANT.id);
    expect(purgeTenantReaderDataMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });
});
