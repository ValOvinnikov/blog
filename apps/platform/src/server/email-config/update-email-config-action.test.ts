import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  type TTenantPlan,
} from '@blog/db/constants';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';
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

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { upsertEmailConfig: upsertEmailConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

const REPLY_TO_ADDRESS = 'support@acme.example';
const CONTACT_RECIPIENT = 'leads@acme.example';
const INVALID_EMAIL = 'not-an-email';
const MEMBERSHIP_CREATED_AT = new Date('2026-04-02T00:00:00.000Z');

const VALID_INPUT: TUpdateEmailConfigInput = {
  senderName: 'Acme Co',
  replyToAddress: REPLY_TO_ADDRESS,
  contactRecipient: CONTACT_RECIPIENT,
  footerPostalAddress: '123 Main St, Springfield',
};

const { contactRecipient, ...EDITOR_SAVED_INPUT } = VALID_INPUT;

const mockTenantOnPlan = (plan: TTenantPlan) =>
  vi.mocked(requireTenantMembership).mockResolvedValue({
    tenant: makeReadyTenant({ id: 'tenant-1', plan }),
    membership: {
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: MEMBERSHIP_ROLE.OWNER,
      createdAt: MEMBERSHIP_CREATED_AT,
    },
  });

describe(updateEmailConfigAction, () => {
  beforeEach(() => {
    mockTenantOnPlan(TENANT_PLAN.GROWTH);
    upsertEmailConfigMock.mockReset();
    upsertEmailConfigMock.mockResolvedValue({});
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
  });

  it('re-resolves the tenant from the session against the routed tenant id before writing anything', async () => {
    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(requireTenantMembership).toHaveBeenCalledWith('tenant-1');
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', VALID_INPUT);
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('rejects an invalid reply-to address without ever calling the tenant gate', async () => {
    const result = await updateEmailConfigAction('tenant-1', {
      ...VALID_INPUT,
      replyToAddress: INVALID_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it.each([
    'Acme <evil@attacker.example>',
    REPLY_TO_ADDRESS,
    'Acme\r\nBcc: victim@example.com',
    'Acme "Support"',
    'Acme, Inc',
    'Acme; Support',
  ])(
    'rejects %j as a sender name with a field error explaining it is a display name, and writes nothing',
    async (senderName) => {
      const result = await updateEmailConfigAction('tenant-1', {
        ...VALID_INPUT,
        senderName,
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
        },
      });
      expect(requireTenantMembership).not.toHaveBeenCalled();
      expect(upsertEmailConfigMock).not.toHaveBeenCalled();
    },
  );

  it.each(["Acme & Co's Newsletter", 'Café Müller', 'Acme (Support)'])(
    'accepts %j as a sender name',
    async (senderName) => {
      const result = await updateEmailConfigAction('tenant-1', {
        ...VALID_INPUT,
        senderName,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    },
  );

  it('accepts explicit nulls as "revert to product default"', async () => {
    const result = await updateEmailConfigAction('tenant-1', {
      senderName: null,
      replyToAddress: null,
      footerPostalAddress: null,
      contactRecipient: null,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', {
      senderName: null,
      replyToAddress: null,
      footerPostalAddress: null,
      contactRecipient: null,
    });
  });

  it('rejects an invalid contact recipient with a field error, and writes nothing', async () => {
    const result = await updateEmailConfigAction('tenant-1', {
      ...VALID_INPUT,
      contactRecipient: INVALID_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        contactRecipient: {
          reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
        },
      },
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('leaves the stored contact recipient untouched on a plan without the contact form', async () => {
    mockTenantOnPlan(TENANT_PLAN.FREE);

    await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(upsertEmailConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ contactRecipient: undefined }),
    );
  });

  it('leaves the stored contact recipient untouched when an editor saves', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue({
      tenant: makeReadyTenant({ id: 'tenant-1', plan: TENANT_PLAN.GROWTH }),
      membership: {
        id: 'membership-2',
        userId: 'user-2',
        tenantId: 'tenant-1',
        role: MEMBERSHIP_ROLE.EDITOR,
        createdAt: MEMBERSHIP_CREATED_AT,
      },
    });

    await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(upsertEmailConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ contactRecipient: undefined }),
    );
    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { fields: Object.keys(EDITOR_SAVED_INPUT) },
      }),
    );
  });

  it('saves a contact recipient and clears it again with null', async () => {
    await updateEmailConfigAction('tenant-1', VALID_INPUT);
    await updateEmailConfigAction('tenant-1', {
      ...VALID_INPUT,
      contactRecipient: null,
    });

    expect(upsertEmailConfigMock).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      expect.objectContaining({ contactRecipient }),
    );
    expect(upsertEmailConfigMock).toHaveBeenNthCalledWith(
      2,
      'tenant-1',
      expect.objectContaining({ contactRecipient: null }),
    );
  });

  it('reports failure instead of throwing when the write itself fails, and records no audit event', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'email_config.update_failed',
      expect.objectContaining({
        tenantId: 'tenant-1',
        error: expect.any(Error),
      }),
    );
  });

  it('records a SETTINGS_UPDATED audit event naming the saved fields, never their addresses', async () => {
    await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'user-1',
      actorEmail: 'user@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: { fields: Object.keys(VALID_INPUT) },
    });
  });

  it('still succeeds when the audit write fails, and logs the failure', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection reset'));

    const result = await updateEmailConfigAction('tenant-1', VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      updateEmailConfigAction('tenant-1', VALID_INPUT),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(upsertEmailConfigMock).not.toHaveBeenCalled();
  });
});
