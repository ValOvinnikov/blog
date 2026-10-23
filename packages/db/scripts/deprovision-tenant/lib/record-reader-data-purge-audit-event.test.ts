import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_ENV,
  MOCK_PURGED_READER_DATA_COUNTS,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { faker } from '@faker-js/faker';

import { recordReaderDataPurgeAuditEvent } from './record-reader-data-purge-audit-event';

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
}));

const MOCK_TENANT_ID = faker.string.uuid();

vi.mock('@blog/db/queries/audit-events', () => ({
  insertAuditEvent: insertAuditEventMock,
}));

beforeEach(() => {
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(recordReaderDataPurgeAuditEvent, () => {
  it('inserts a READER_DATA_PURGED/TENANT audit event with the per-table counts, attributed to the GitHub actor', async () => {
    await recordReaderDataPurgeAuditEvent(
      MOCK_TENANT_ID,
      MOCK_DEPROVISION_ENV,
      MOCK_PURGED_READER_DATA_COUNTS,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        via: 'deprovision-tenant-workflow',
        runId: MOCK_DEPROVISION_ENV.githubRunId,
        ...MOCK_PURGED_READER_DATA_COUNTS,
      },
    });
  });

  it('logs and does not throw when the insert rejects', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordReaderDataPurgeAuditEvent(
        MOCK_TENANT_ID,
        MOCK_DEPROVISION_ENV,
        MOCK_PURGED_READER_DATA_COUNTS,
      ),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when GITHUB_ACTOR is unset', async () => {
    await recordReaderDataPurgeAuditEvent(
      MOCK_TENANT_ID,
      { ...MOCK_DEPROVISION_ENV, githubActor: undefined },
      MOCK_PURGED_READER_DATA_COUNTS,
    );

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
