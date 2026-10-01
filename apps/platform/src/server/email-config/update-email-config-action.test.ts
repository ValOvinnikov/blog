import { AUDIT_ACTION, AUDIT_TARGET_TYPE } from '@blog/config';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { logger } from '@platform/utils/logger/logger';

import {
  updateEmailConfigAction,
  type TUpdateEmailConfigInput,
} from './update-email-config-action';

const { upsertEmailConfigMock, insertAuditEventMock } = vi.hoisted(() => ({
  upsertEmailConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/utils/logger/logger');

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
    upsertEmailConfigMock.mockReset();
    upsertEmailConfigMock.mockResolvedValue({});
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
  });

  it('re-resolves the tenant from the session against the routed tenant id before writing anything', async () => {
    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(requireTenantMembership).toHaveBeenCalledWith('tenant-1');
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', VALID_INPUT);
    expect(result).toEqual({ ok: true });
  });

  it('rejects an invalid reply-to address without ever calling the tenant gate', async () => {
    const result = await updateEmailConfigAction('tenant-1', {
      ...VALID_INPUT,
      replyToAddress: 'not-an-email',
    });

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('accepts explicit nulls as "revert to product default"', async () => {
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
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: false });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'email_config.update_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('records a SETTINGS_UPDATED audit event, with the operator as actor', async () => {
    await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'user-1',
      actorEmail: 'user@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: VALID_INPUT,
    });
  });

  it('still returns ok when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ ok: true });
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error('NEXT_REDIRECT'),
    );

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error('NEXT_NOT_FOUND'),
    );

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });
});
