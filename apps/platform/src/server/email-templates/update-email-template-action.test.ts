import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { SETTINGS_REFUSAL } from '@platform/constants/settings';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_EMAIL,
} from '@platform/testing/admins/operator';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import type { Session } from 'next-auth';

import {
  updateEmailTemplateAction,
  type TUpdateEmailTemplateInput,
} from './update-email-template-action';

const { upsertEmailTemplateMock, insertAuditEventMock, selectLiveLocalesMock } =
  vi.hoisted(() => ({
    upsertEmailTemplateMock: vi.fn(),
    insertAuditEventMock: vi.fn(),
    selectLiveLocalesMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: {
    emailTemplates: { upsertEmailTemplate: upsertEmailTemplateMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

const LINK_KEY = 'link1';
const LINK_TEXT = 'click here';
const SAFE_HREF = 'https://acme.example';
const JAVASCRIPT_HREF = 'javascript:alert(1)';

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const loggerErrorMock = vi.mocked(logger.error);

const mockMembershipAndUpsert = (
  upsertResult: Partial<{
    tenantId: string;
    templateType: string;
    subject: string | null;
    body: TUpdateEmailTemplateInput['body'];
    logoAssetUrl: string | undefined;
  }> = {},
) => {
  requireTenantMembershipMock.mockResolvedValue({
    tenant: { id: MOCK_TENANT_ID },
    membership: { role: MEMBERSHIP_ROLE.OWNER },
  });
  upsertEmailTemplateMock.mockResolvedValue({
    tenantId: MOCK_TENANT_ID,
    templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    subject: VALID_INPUT.subject,
    body: VALID_INPUT.body,
    logoAssetUrl: undefined,
    ...upsertResult,
  });
};

const VALID_INPUT: TUpdateEmailTemplateInput = {
  subject: 'Sign in to Acme Co',
  body: [
    {
      _type: 'block',
      _key: 'k1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Hello', marks: [] }],
      markDefs: [],
    },
  ],
};

describe(updateEmailTemplateAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    upsertEmailTemplateMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.FR,
    ]);
    mockMembershipAndUpsert();
  });

  it('writes the copy to the requested language', async () => {
    await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.FR,
      VALID_INPUT,
    );

    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
      LOCALE_ISO_CODES.FR,
    );
  });

  it('rejects a language the tenant does not offer without writing', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.DE,
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: SETTINGS_REFUSAL.LOCALE_NOT_LIVE,
    });
    expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
  });

  it('rejects an unrecognized language without ever calling the tenant gate', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      'XX' as never,
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('re-resolves the tenant from the session against the routed id before writing', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      VALID_INPUT,
    );

    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
      LOCALE_ISO_CODES.EN,
    );
    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
  });

  it('rejects an unrecognized template type without ever calling the tenant gate', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      'NOT_A_TEMPLATE' as never,
      LOCALE_ISO_CODES.EN,
      VALID_INPUT,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('rejects an empty subject string rather than storing it as a blank', async () => {
    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      { ...VALID_INPUT, subject: '' },
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('accepts a body whose link markDef has a safe href', async () => {
    const input: TUpdateEmailTemplateInput = {
      subject: 'Sign in',
      body: [
        {
          _type: 'block',
          _key: 'k1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 's1',
              text: LINK_TEXT,
              marks: [LINK_KEY],
            },
          ],
          markDefs: [{ _type: 'link', _key: LINK_KEY, href: SAFE_HREF }],
        },
      ],
    };

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      input,
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      input,
      LOCALE_ISO_CODES.EN,
    );
  });

  it.each([
    ['a javascript: href', JAVASCRIPT_HREF],
    ['a data: href', 'data:text/html,<script>alert(1)</script>'],
    [
      'a case- and whitespace-obfuscated javascript: href',
      '  JaVaScRiPt:alert(1)',
    ],
  ])(
    'rejects the whole update — never reaching upsertEmailTemplate — for a body carrying %s',
    async (_description, href) => {
      const input: TUpdateEmailTemplateInput = {
        subject: 'Sign in',
        body: [
          {
            _type: 'block',
            _key: 'k1',
            style: 'normal',
            children: [
              {
                _type: 'span',
                _key: 's1',
                text: LINK_TEXT,
                marks: [LINK_KEY],
              },
            ],
            markDefs: [{ _type: 'link', _key: LINK_KEY, href }],
          },
        ],
      };

      const result = await updateEmailTemplateAction(
        MOCK_TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.EN,
        input,
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {},
      });
      expect(requireTenantMembershipMock).not.toHaveBeenCalled();
      expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
    },
  );

  it('rejects a malicious href buried in a later markDef of a later block', async () => {
    const input: TUpdateEmailTemplateInput = {
      subject: 'Sign in',
      body: [
        {
          _type: 'block',
          _key: 'k1',
          style: 'normal',
          children: [
            { _type: 'span', _key: 's1', text: 'safe link', marks: [LINK_KEY] },
          ],
          markDefs: [{ _type: 'link', _key: LINK_KEY, href: SAFE_HREF }],
        },
        {
          _type: 'block',
          _key: 'k2',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 's2',
              text: 'also safe',
              marks: ['link2'],
            },
            {
              _type: 'span',
              _key: 's3',
              text: 'malicious',
              marks: ['link3'],
            },
          ],
          markDefs: [
            { _type: 'link', _key: 'link2', href: 'https://safe.example' },
            { _type: 'link', _key: 'link3', href: JAVASCRIPT_HREF },
          ],
        },
      ],
    };

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      input,
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {},
    });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
    expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
  });

  it('accepts explicit nulls as "revert to product default"', async () => {
    mockMembershipAndUpsert({ subject: 'Default subject', body: [] });

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      { subject: null, body: null },
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: null, body: null },
      LOCALE_ISO_CODES.EN,
    );
  });

  it('reports failure without throwing, and no audit event, when the write fails', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: MOCK_TENANT_ID },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    upsertEmailTemplateMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      VALID_INPUT,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event, with the operator as actor', async () => {
    await updateEmailTemplateAction(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.EN,
      VALID_INPUT,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: LOCALE_ISO_CODES.EN,
      },
    });
  });

  it.each([
    [
      'the sign-in redirect',
      'unauthenticated',
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    ],
    [
      'the 404',
      'the session has no membership',
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    ],
  ])(
    'propagates %s the tenant gate throws when %s',
    async (_description, _reason, digest) => {
      requireTenantMembershipMock.mockImplementation(() => {
        throw new Error(digest);
      });

      await expect(
        updateEmailTemplateAction(
          MOCK_TENANT_ID,
          EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          LOCALE_ISO_CODES.EN,
          VALID_INPUT,
        ),
      ).rejects.toThrow(digest);

      expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
    },
  );
});
