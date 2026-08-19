import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';

const { authMock, insertAuditEventMock, loggerErrorMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

describe('recordAuditEvent', () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'user-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('inserts the actor, action, target, and details exactly as given', async () => {
    const { recordAuditEvent } = await import('./record-audit-event');

    await recordAuditEvent({
      logEvent: 'test.audit_failed',
      action: AUDIT_ACTION.PLAN_CHANGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: { previousPlan: 'FREE', plan: 'PRO' },
    });

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'user-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.PLAN_CHANGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: { previousPlan: 'FREE', plan: 'PRO' },
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('swallows an insert failure, logging under the caller-supplied event name', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));
    const { recordAuditEvent } = await import('./record-audit-event');

    await expect(
      recordAuditEvent({
        logEvent: 'test.audit_failed',
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: 'tenant-1',
      }),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      'test.audit_failed',
      expect.objectContaining({
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('swallows a missing session actor without ever calling the insert', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', email: undefined } });
    const { recordAuditEvent } = await import('./record-audit-event');

    await recordAuditEvent({
      logEvent: 'test.audit_failed',
      action: AUDIT_ACTION.CREATED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'test.audit_failed',
      expect.objectContaining({ targetId: 'tenant-1' }),
    );
  });
});
