import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { MOCK_OPERATOR_ID } from '@platform/testing/admins/operator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import { recordAuditEvent } from './record-audit-event';

faker.seed(5998);

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

const MOCK_LOG_EVENT = faker.lorem.slug();
const MOCK_SESSION_EXPIRES = faker.date.future().toISOString();
const MOCK_AUDIT_EVENT_ID = faker.string.uuid();
const MOCK_INSERT_ERROR = new Error(faker.lorem.sentence());
const MOCK_DETAILS = {
  previousPlan: TENANT_PLAN.FREE,
  plan: TENANT_PLAN.GROWTH,
};

const authMock = vi.mocked<() => Promise<Session | null>>(auth);

const AUDITED_TENANT_CREATION = {
  logEvent: MOCK_LOG_EVENT,
  action: AUDIT_ACTION.CREATED,
  targetType: AUDIT_TARGET_TYPE.TENANT,
  targetId: MOCK_TENANT_ID,
};

describe(recordAuditEvent, () => {
  beforeEach(() => {
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: MOCK_AUDIT_EVENT_ID });
  });

  it('inserts the session actor with the action, target and details as given', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: MOCK_OPERATOR_ID },
      expires: MOCK_SESSION_EXPIRES,
    });

    await recordAuditEvent({
      ...AUDITED_TENANT_CREATION,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      details: MOCK_DETAILS,
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: MOCK_DETAILS,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an insert failure under the caller event name and resolves', async () => {
    insertAuditEventMock.mockRejectedValue(MOCK_INSERT_ERROR);

    await expect(
      recordAuditEvent(AUDITED_TENANT_CREATION),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(MOCK_LOG_EVENT, {
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      error: MOCK_INSERT_ERROR,
    });
  });

  it('logs a missing session actor without calling the insert', async () => {
    authMock.mockResolvedValueOnce(null);

    await recordAuditEvent(AUDITED_TENANT_CREATION);

    const [loggedEvent, context] = vi.mocked(logger.error).mock.calls[0] ?? [];

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggedEvent).toBe(MOCK_LOG_EVENT);
    expect(context?.['targetId']).toBe(MOCK_TENANT_ID);
  });
});
