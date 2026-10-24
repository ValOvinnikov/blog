import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config/constants';
import {
  MOCK_DEPROVISION_AUDIT_ACTOR,
  MOCK_DEPROVISION_ENV,
} from '@blog/db/testing/deprovision-tenant/fixtures';
import { faker } from '@faker-js/faker';

import { recordDeprovisionAuditEvent } from './record-deprovision-audit-event';

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

describe(recordDeprovisionAuditEvent, () => {
  it('inserts a DEPROVISIONED/TENANT audit event attributed to the GitHub actor', async () => {
    await recordDeprovisionAuditEvent(MOCK_TENANT_ID, MOCK_DEPROVISION_ENV);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      ...MOCK_DEPROVISION_AUDIT_ACTOR,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        via: 'deprovision-tenant-workflow',
        runId: MOCK_DEPROVISION_ENV.githubRunId,
      },
    });
  });

  it('logs and does not throw when the insert rejects', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordDeprovisionAuditEvent(MOCK_TENANT_ID, MOCK_DEPROVISION_ENV),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when GITHUB_ACTOR is unset', async () => {
    await recordDeprovisionAuditEvent(MOCK_TENANT_ID, {
      ...MOCK_DEPROVISION_ENV,
      githubActor: undefined,
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
