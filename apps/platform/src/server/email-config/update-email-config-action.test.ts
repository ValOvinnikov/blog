import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  type TMembershipRole,
  type TTenantPlan,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { EMAIL_CONFIG_LOG } from '@platform/constants/email-config';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_SESSION,
} from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  mockReadyTenant,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import {
  updateEmailConfigAction,
  type TUpdateEmailConfigInput,
} from './update-email-config-action';

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { upsertEmailConfig: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');

faker.seed(5998);

const MOCK_REPLY_TO_ADDRESS = faker.internet.email();
const MOCK_INVALID_EMAIL = faker.lorem.word();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());

const VALID_INPUT: TUpdateEmailConfigInput = {
  senderName: faker.lorem.words(2),
  replyToAddress: MOCK_REPLY_TO_ADDRESS,
  contactRecipient: faker.internet.email(),
  footerPostalAddress: faker.location.streetAddress(),
};

const NON_RECIPIENT_INPUT: TUpdateEmailConfigInput = {
  senderName: VALID_INPUT.senderName,
  replyToAddress: VALID_INPUT.replyToAddress,
  footerPostalAddress: VALID_INPUT.footerPostalAddress,
};

const ALL_NULL_INPUT: TUpdateEmailConfigInput = {
  senderName: null,
  replyToAddress: null,
  footerPostalAddress: null,
  contactRecipient: null,
};

const { upsertEmailConfig } = queries.emailConfig;
const { insertAuditEvent } = queries.auditEvents;

const mockMemberOnPlan = (plan: TTenantPlan, role: TMembershipRole) =>
  vi.mocked(requireTenantMembership).mockResolvedValue({
    tenant: mockReadyTenant({ id: MOCK_TENANT_ID, plan }),
    membership: mockMembership({ role }),
  });

describe(updateEmailConfigAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockReset();
    vi.mocked(upsertEmailConfig).mockReset();
    vi.mocked(insertAuditEvent).mockReset();
    mockMemberOnPlan(TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.OWNER);
  });

  it('writes the settings for the tenant resolved from the session', async () => {
    const result = await updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertEmailConfig).toHaveBeenCalledWith(MOCK_TENANT_ID, VALID_INPUT);
  });

  it('rejects an invalid reply-to address before the tenant gate', async () => {
    const result = await updateEmailConfigAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      replyToAddress: MOCK_INVALID_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it.each([
    'Acme <evil@attacker.example>',
    MOCK_REPLY_TO_ADDRESS,
    'Acme\r\nBcc: victim@example.com',
    'Acme "Support"',
    'Acme, Inc',
    'Acme; Support',
  ])('rejects %j as a sender name and writes nothing', async (senderName) => {
    const result = await updateEmailConfigAction(MOCK_TENANT_ID, {
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
    expect(upsertEmailConfig).not.toHaveBeenCalled();
  });

  it.each(["Acme & Co's Newsletter", 'Café Müller', 'Acme (Support)'])(
    'accepts %j as a sender name',
    async (senderName) => {
      const result = await updateEmailConfigAction(MOCK_TENANT_ID, {
        ...VALID_INPUT,
        senderName,
      });

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    },
  );

  it('writes explicit nulls so each setting reverts to the product default', async () => {
    const result = await updateEmailConfigAction(
      MOCK_TENANT_ID,
      ALL_NULL_INPUT,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfig).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      ALL_NULL_INPUT,
    );
  });

  it('rejects an invalid contact recipient and writes nothing', async () => {
    const result = await updateEmailConfigAction(MOCK_TENANT_ID, {
      ...VALID_INPUT,
      contactRecipient: MOCK_INVALID_EMAIL,
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
    expect(upsertEmailConfig).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a plan without the contact form',
      TENANT_PLAN.FREE,
      MEMBERSHIP_ROLE.OWNER,
    ],
    ['an editor', TENANT_PLAN.GROWTH, MEMBERSHIP_ROLE.EDITOR],
  ])(
    'leaves the stored contact recipient untouched for %s',
    async (_caller, plan, role) => {
      mockMemberOnPlan(plan, role);
      mockedAuth.mockResolvedValueOnce(MOCK_OPERATOR_SESSION);

      await updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT);

      expect(upsertEmailConfig).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        ...NON_RECIPIENT_INPUT,
        contactRecipient: undefined,
      });
      expect(insertAuditEvent).toHaveBeenCalledWith({
        actorId: MOCK_OPERATOR_ID,
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: MOCK_TENANT_ID,
        details: { fields: Object.keys(NON_RECIPIENT_INPUT) },
      });
    },
  );

  it('reports failure and records no audit event when the write fails', async () => {
    vi.mocked(upsertEmailConfig).mockRejectedValue(MOCK_DB_ERROR);

    const result = await updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEvent).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(EMAIL_CONFIG_LOG.UPDATE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      error: MOCK_DB_ERROR,
    });
  });

  it('audits the saved field names, never their values', async () => {
    mockedAuth.mockResolvedValueOnce(MOCK_OPERATOR_SESSION);

    await updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { fields: Object.keys(VALID_INPUT) },
    });
  });

  it('still succeeds and logs when the audit write fails', async () => {
    vi.mocked(insertAuditEvent).mockRejectedValue(MOCK_DB_ERROR);

    const result = await updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(logger.error).toHaveBeenCalledWith(
      EMAIL_CONFIG_LOG.UPDATE_AUDIT_FAILED,
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: MOCK_TENANT_ID,
        error: MOCK_DB_ERROR,
      },
    );
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (gateError) => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(gateError),
    );

    await expect(
      updateEmailConfigAction(MOCK_TENANT_ID, VALID_INPUT),
    ).rejects.toThrow(gateError);

    expect(upsertEmailConfig).not.toHaveBeenCalled();
  });
});
