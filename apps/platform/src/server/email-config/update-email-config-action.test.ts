import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';

import {
  updateEmailConfigAction,
  type TUpdateEmailConfigInput,
} from './update-email-config-action';

const {
  requireTenantMembershipMock,
  authMock,
  upsertEmailConfigMock,
  insertAuditEventMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  upsertEmailConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@platform/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { upsertEmailConfig: upsertEmailConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const VALID_INPUT: TUpdateEmailConfigInput = {
  senderName: 'Acme Co',
  replyToAddress: 'support@acme.example',
  footerPostalAddress: '123 Main St, Springfield',
};

describe(updateEmailConfigAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    upsertEmailConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('re-resolves the tenant from the session against the routed tenant id before writing anything', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailConfigMock.mockResolvedValue({});

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', VALID_INPUT);
    expect(result).toEqual({ ok: true });
  });

  it('rejects an invalid reply-to address without ever calling the tenant gate', async () => {
    const result = await updateEmailConfigAction('tenant-1', {
      ...VALID_INPUT,
      replyToAddress: 'not-an-email',
    });

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('accepts explicit nulls as "revert to product default"', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailConfigMock.mockResolvedValue({});

    const result = await updateEmailConfigAction('tenant-1', {
      senderName: null,
      replyToAddress: null,
      footerPostalAddress: null,
    });

    expect(result).toEqual({ ok: true });
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', {
      senderName: null,
      replyToAddress: null,
      footerPostalAddress: null,
    });
  });

  it('reports failure instead of throwing when the write itself fails, and records no audit event', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: false });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'email_config.update_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('records a SETTINGS_UPDATED audit event, with the operator as actor', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailConfigMock.mockResolvedValue({});

    await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: VALID_INPUT,
    });
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailConfigMock.mockResolvedValue({});
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: true });
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });
});
