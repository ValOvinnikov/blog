import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { MOCK_OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

const LOG_EVENT = 'test.audit_failed';

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);

describe('recordAuditEvent', () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: MOCK_OPERATOR_EMAIL },
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('inserts the actor, action, target, and details exactly as given', async () => {
    const { recordAuditEvent } = await import('./record-audit-event');

    await recordAuditEvent({
      logEvent: LOG_EVENT,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { previousPlan: TENANT_PLAN.FREE, plan: 'PRO' },
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'user-1',
      actorEmail: MOCK_OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { previousPlan: TENANT_PLAN.FREE, plan: 'PRO' },
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('swallows an insert failure, logging under the caller-supplied event name', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const { recordAuditEvent } = await import('./record-audit-event');

    await expect(
      recordAuditEvent({
        logEvent: LOG_EVENT,
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
      }),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      LOG_EVENT,
      expect.objectContaining({
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: MOCK_TENANT_ID,
        error: expect.any(Error),
      }),
    );
  });

  it('swallows a missing session actor without ever calling the insert', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', email: undefined } });
    const { recordAuditEvent } = await import('./record-audit-event');

    await recordAuditEvent({
      logEvent: LOG_EVENT,
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      LOG_EVENT,
      expect.objectContaining({ targetId: MOCK_TENANT_ID }),
    );
  });
});
