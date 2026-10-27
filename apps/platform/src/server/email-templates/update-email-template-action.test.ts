import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { EMAIL_TEMPLATES_LOG } from '@platform/constants/email-templates';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_SESSION,
} from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import {
  mockEmailBodyWithLink,
  mockEmailBodyWithText,
  mockEmailTemplateResult,
} from '@platform/testing/email/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';

import {
  updateEmailTemplateAction,
  type TUpdateEmailTemplateInput,
} from './update-email-template-action';

vi.mock('@blog/db', () => ({
  queries: {
    emailTemplates: { upsertEmailTemplate: vi.fn() },
    auditEvents: { insertAuditEvent: vi.fn() },
    tenants: { selectLiveLocales: vi.fn() },
  },
}));

vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');

faker.seed(5998);

const { MAGIC_LINK } = EMAIL_TEMPLATE_TYPE;
const { EN, FR, DE } = LOCALE_ISO_CODES;

const MOCK_SAFE_HREF = faker.internet.url();
const MOCK_JAVASCRIPT_HREF = 'javascript:alert(1)';
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());

const VALID_INPUT: TUpdateEmailTemplateInput = {
  subject: faker.lorem.sentence(),
  body: mockEmailBodyWithText(faker.lorem.word()),
};

const { upsertEmailTemplate } = queries.emailTemplates;
const { insertAuditEvent } = queries.auditEvents;
const { selectLiveLocales } = queries.tenants;

describe(updateEmailTemplateAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership).mockReset();
    vi.mocked(upsertEmailTemplate).mockReset();
    vi.mocked(insertAuditEvent).mockReset();
    vi.mocked(selectLiveLocales).mockReset();
    vi.mocked(selectLiveLocales).mockReturnValue([EN, FR]);
  });

  it('writes the copy in the requested language for the routed tenant', async () => {
    const stored = mockEmailTemplateResult({ templateType: MAGIC_LINK });
    vi.mocked(upsertEmailTemplate).mockResolvedValue(stored);

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      FR,
      VALID_INPUT,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, result: stored });
    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertEmailTemplate).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      VALID_INPUT,
      FR,
    );
  });

  it('refuses a language the tenant does not offer without writing', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      DE,
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.LOCALE_NOT_LIVE,
    });
    expect(upsertEmailTemplate).not.toHaveBeenCalled();
  });

  it('rejects an unrecognized language before the tenant gate', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      // @ts-expect-error -- a Server Action is callable with any language
      faker.lorem.word(),
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('rejects an unrecognized template type before the tenant gate', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      // @ts-expect-error -- a Server Action is callable with any template type
      faker.lorem.word(),
      EN,
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('rejects an empty subject rather than storing a blank', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      { ...VALID_INPUT, subject: '' },
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
  });

  it('accepts a body whose link has a safe href', async () => {
    const input: TUpdateEmailTemplateInput = {
      ...VALID_INPUT,
      body: mockEmailBodyWithLink(MOCK_SAFE_HREF),
    };

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      input,
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(upsertEmailTemplate).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      input,
      EN,
    );
  });

  it.each([
    ['a javascript: href', mockEmailBodyWithLink(MOCK_JAVASCRIPT_HREF)],
    [
      'a data: href',
      mockEmailBodyWithLink('data:text/html,<script>alert(1)</script>'),
    ],
    [
      'a case- and whitespace-obfuscated javascript: href',
      mockEmailBodyWithLink('  JaVaScRiPt:alert(1)'),
    ],
    [
      'an unsafe href in a later block',
      [
        ...mockEmailBodyWithLink(MOCK_SAFE_HREF),
        ...mockEmailBodyWithLink(MOCK_JAVASCRIPT_HREF),
      ],
    ],
  ])('rejects the whole update for a body carrying %s', async (_href, body) => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      { ...VALID_INPUT, body },
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembership).not.toHaveBeenCalled();
    expect(upsertEmailTemplate).not.toHaveBeenCalled();
  });

  it('writes explicit nulls so the copy reverts to the product default', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      { subject: null, body: null },
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(upsertEmailTemplate).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      { subject: null, body: null },
      EN,
    );
  });

  it('reports failure and records no audit event when the write fails', async () => {
    vi.mocked(upsertEmailTemplate).mockRejectedValue(MOCK_DB_ERROR);

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      VALID_INPUT,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEvent).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      EMAIL_TEMPLATES_LOG.UPDATE_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        templateType: MAGIC_LINK,
        locale: EN,
        error: MOCK_DB_ERROR,
      },
    );
  });

  it('records a settings-updated audit event with the operator as actor', async () => {
    mockedAuth.mockResolvedValueOnce(MOCK_OPERATOR_SESSION);

    await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      MAGIC_LINK,
      EN,
      VALID_INPUT,
    );

    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { templateType: MAGIC_LINK, locale: EN },
    });
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (gateError) => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(gateError),
    );

    await expect(
      updateEmailTemplateAction(MOCK_TENANT_ID, MAGIC_LINK, EN, VALID_INPUT),
    ).rejects.toThrow(gateError);

    expect(upsertEmailTemplate).not.toHaveBeenCalled();
  });
});
