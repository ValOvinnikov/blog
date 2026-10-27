import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_SESSION,
} from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import { MOCK_BLOB_TOKEN } from '@platform/testing/blob/fixtures';
import {
  MOCK_EMAIL_LOGO_URL,
  mockEmailConfig,
  mockEmailTemplateResult,
} from '@platform/testing/email/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { del } from '@vercel/blob';

import { clearEmailLogoAction } from './clear-email-logo-action';

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: { getEmailConfig: vi.fn(), upsertEmailConfig: vi.fn() },
    emailTemplates: {
      getEmailTemplate: vi.fn(),
      upsertEmailTemplate: vi.fn(),
    },
    auditEvents: { insertAuditEvent: vi.fn() },
  },
}));

vi.mock('@vercel/blob', () => ({ del: vi.fn() }));
vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');
vi.mock('@platform/utils/env/env');

faker.seed(5998);

const MOCK_TEMPLATE_LOGO_URL = faker.internet.url();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const TENANT_TARGET = { type: 'tenant' } as const;
const TEMPLATE_TARGET = {
  type: 'template',
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
} as const;

const { getEmailConfig, upsertEmailConfig } = queries.emailConfig;
const { getEmailTemplate, upsertEmailTemplate } = queries.emailTemplates;
const { insertAuditEvent } = queries.auditEvents;

describe(clearEmailLogoAction, () => {
  beforeEach(() => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });
    vi.mocked(getEmailConfig).mockReset();
    vi.mocked(getEmailTemplate).mockReset();
    vi.mocked(upsertEmailConfig).mockReset();
    vi.mocked(upsertEmailTemplate).mockReset();
    vi.mocked(insertAuditEvent).mockReset();
    vi.mocked(getEmailConfig).mockResolvedValue(
      mockEmailConfig({ logoAssetUrl: MOCK_EMAIL_LOGO_URL }),
    );
  });

  it('succeeds without writing when the tenant email logo is already unset', async () => {
    vi.mocked(getEmailConfig).mockResolvedValue(undefined);

    const result = await clearEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfig).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it('clears the tenant email logo and deletes the blob', async () => {
    const result = await clearEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailConfig).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      logoAssetUrl: null,
    });
    expect(del).toHaveBeenCalledWith(MOCK_EMAIL_LOGO_URL, {
      token: MOCK_BLOB_TOKEN,
    });
  });

  it('clears a per-template logo without touching the tenant email logo', async () => {
    vi.mocked(getEmailTemplate).mockResolvedValue(
      mockEmailTemplateResult({ logoAssetUrl: MOCK_TEMPLATE_LOGO_URL }),
    );

    const result = await clearEmailLogoAction(MOCK_TENANT_ID, TEMPLATE_TARGET);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertEmailTemplate).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: null },
    );
    expect(del).toHaveBeenCalledWith(MOCK_TEMPLATE_LOGO_URL, {
      token: MOCK_BLOB_TOKEN,
    });
    expect(upsertEmailConfig).not.toHaveBeenCalled();
  });

  it('records one settings-updated audit event for the operator', async () => {
    mockedAuth.mockResolvedValueOnce(MOCK_OPERATOR_SESSION);

    await clearEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET);

    expect(insertAuditEvent).toHaveBeenCalledTimes(1);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { target: TENANT_TARGET, operation: 'clear' },
    });
  });

  it('reports a server error and records no audit event when the write fails', async () => {
    vi.mocked(upsertEmailConfig).mockRejectedValue(MOCK_DB_ERROR);

    const result = await clearEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (gateError) => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(gateError),
    );

    await expect(
      clearEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET),
    ).rejects.toThrow(gateError);

    expect(upsertEmailConfig).not.toHaveBeenCalled();
  });
});
