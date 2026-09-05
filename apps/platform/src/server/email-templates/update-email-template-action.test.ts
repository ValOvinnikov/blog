import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
} from '@blog/config';

import {
  updateEmailTemplateAction,
  type TUpdateEmailTemplateInput,
} from './update-email-template-action';

const {
  requireTenantMembershipMock,
  authMock,
  upsertEmailTemplateMock,
  insertAuditEventMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  upsertEmailTemplateMock: vi.fn(),
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
    emailTemplates: { upsertEmailTemplate: upsertEmailTemplateMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

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
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    upsertEmailTemplateMock.mockReset();
    insertAuditEventMock.mockReset();
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    loggerErrorMock.mockReset();
  });

  it('re-resolves the tenant from the session against the routed tenant id before writing anything', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailTemplateMock.mockResolvedValue({
      tenantId: 'tenant-1',
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: VALID_INPUT.subject,
      body: VALID_INPUT.body,
      logoAssetUrl: undefined,
    });

    const result = await updateEmailTemplateAction(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
    );

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
    );
    expect(result.ok).toBe(true);
  });

  it('rejects an unrecognized template type without ever calling the tenant gate', async () => {
    const result = await updateEmailTemplateAction(
      'tenant-1',
      'NOT_A_TEMPLATE' as never,
      VALID_INPUT,
    );

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('rejects an empty subject string rather than storing it as a blank', async () => {
    const result = await updateEmailTemplateAction(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { ...VALID_INPUT, subject: '' },
    );

    expect(result).toEqual({ ok: false });
    expect(requireTenantMembershipMock).not.toHaveBeenCalled();
  });

  it('accepts explicit nulls as "revert to product default"', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailTemplateMock.mockResolvedValue({
      tenantId: 'tenant-1',
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: 'Default subject',
      body: [],
      logoAssetUrl: undefined,
    });

    const result = await updateEmailTemplateAction(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: null, body: null },
    );

    expect(result.ok).toBe(true);
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: null, body: null },
    );
  });

  it('reports failure instead of throwing when the write itself fails, and records no audit event', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailTemplateMock.mockRejectedValue(new Error('db unavailable'));

    const result = await updateEmailTemplateAction(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
    );

    expect(result).toEqual({ ok: false });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records a SETTINGS_UPDATED audit event, with the operator as actor', async () => {
    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    upsertEmailTemplateMock.mockResolvedValue({
      tenantId: 'tenant-1',
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: VALID_INPUT.subject,
      body: VALID_INPUT.body,
      logoAssetUrl: undefined,
    });

    await updateEmailTemplateAction(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      VALID_INPUT,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: { templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK },
    });
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      updateEmailTemplateAction(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        VALID_INPUT,
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      updateEmailTemplateAction(
        'tenant-1',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        VALID_INPUT,
      ),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(upsertEmailTemplateMock).not.toHaveBeenCalled();
  });
});
