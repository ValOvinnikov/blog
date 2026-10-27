import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_AUDIT_DETAILS,
  MOCK_DEPROVISION_ENV,
  MOCK_PURGED_READER_DATA_COUNTS,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { MOCK_STEP_ERROR } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { recordReaderDataPurgeAuditEvent } from './record-reader-data-purge-audit-event';

vi.mock('@blog/db/queries/audit-events');

faker.seed(5765);

const MOCK_TENANT_ID = faker.string.uuid();

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(recordReaderDataPurgeAuditEvent, () => {
  it('records a READER_DATA_PURGED event with the per-table counts', async () => {
    await recordReaderDataPurgeAuditEvent(
      MOCK_TENANT_ID,
      MOCK_DEPROVISION_ENV,
      MOCK_PURGED_READER_DATA_COUNTS,
    );

    expect(insertAuditEvent).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        ...MOCK_DEPROVISION_AUDIT_DETAILS,
        ...MOCK_PURGED_READER_DATA_COUNTS,
      },
    });
  });

  it('logs and does not throw when the insert rejects', async () => {
    vi.mocked(insertAuditEvent).mockRejectedValueOnce(
      new Error(MOCK_STEP_ERROR),
    );

    await expect(
      recordReaderDataPurgeAuditEvent(
        MOCK_TENANT_ID,
        MOCK_DEPROVISION_ENV,
        MOCK_PURGED_READER_DATA_COUNTS,
      ),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when the GitHub actor is unset', async () => {
    await recordReaderDataPurgeAuditEvent(
      MOCK_TENANT_ID,
      { ...MOCK_DEPROVISION_ENV, githubActor: undefined },
      MOCK_PURGED_READER_DATA_COUNTS,
    );

    expect(insertAuditEvent).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
