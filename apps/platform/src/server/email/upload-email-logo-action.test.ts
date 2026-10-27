import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { validateEmailLogoUpload } from '@platform/server/email/validate-email-logo';
import {
  MOCK_OPERATOR_ID,
  MOCK_OPERATOR_SESSION,
} from '@platform/testing/admins/operator';
import { mockedAuth } from '@platform/testing/auth/mocked-auth';
import {
  MOCK_BLOB_TOKEN,
  mockPutBlobResult,
} from '@platform/testing/blob/fixtures';
import {
  MOCK_EMAIL_LOGO_URL,
  mockEmailConfig,
  mockEmailTemplateResult,
} from '@platform/testing/email/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import { put } from '@vercel/blob';

import { uploadEmailLogoAction } from './upload-email-logo-action';

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

vi.mock('@vercel/blob', () => ({ put: vi.fn(), del: vi.fn() }));
vi.mock('@platform/server/email/validate-email-logo');
vi.mock('@platform/server/auth/require-tenant-membership');
vi.mock('@platform/server/auth/auth');
vi.mock('@platform/utils/env/env');

faker.seed(5998);

const MOCK_TEMPLATE_LOGO_URL = faker.internet.url();
const MOCK_DB_ERROR = new Error(faker.lorem.sentence());
const MOCK_LOGO_FILE = new File([faker.lorem.word()], 'logo.png', {
  type: 'image/png',
});
const MOCK_VALID_ASSET = {
  buffer: Buffer.from(faker.lorem.word()),
  contentType: 'image/png',
  extension: 'png',
};
const TENANT_TARGET = { type: 'tenant' } as const;
const TEMPLATE_TARGET = {
  type: 'template',
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
} as const;

const { getEmailConfig, upsertEmailConfig } = queries.emailConfig;
const { getEmailTemplate, upsertEmailTemplate } = queries.emailTemplates;
const { insertAuditEvent } = queries.auditEvents;

const buildLogoFormData = (): FormData => {
  const formData = new FormData();
  formData.append('file', MOCK_LOGO_FILE);
  return formData;
};

describe(uploadEmailLogoAction, () => {
  beforeEach(() => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });
    vi.mocked(getEmailConfig).mockReset();
    vi.mocked(getEmailTemplate).mockReset();
    vi.mocked(upsertEmailConfig).mockReset();
    vi.mocked(upsertEmailTemplate).mockReset();
    vi.mocked(insertAuditEvent).mockReset();
    vi.mocked(validateEmailLogoUpload).mockReset();
    vi.mocked(put).mockReset();
    vi.mocked(getEmailConfig).mockResolvedValue(mockEmailConfig());
    vi.mocked(getEmailTemplate).mockResolvedValue(mockEmailTemplateResult());
    vi.mocked(validateEmailLogoUpload).mockResolvedValue(
      okResult(MOCK_VALID_ASSET),
    );
    vi.mocked(put).mockResolvedValue(
      mockPutBlobResult({ url: MOCK_EMAIL_LOGO_URL }),
    );
  });

  it('stores the tenant email logo under a random-suffixed email-logo path', async () => {
    const result = await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TENANT_TARGET,
      buildLogoFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_EMAIL_LOGO_URL,
    });
    expect(put).toHaveBeenCalledWith(
      `tenants/${MOCK_TENANT_ID}/email-logo.png`,
      MOCK_VALID_ASSET.buffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: MOCK_VALID_ASSET.contentType,
        token: MOCK_BLOB_TOKEN,
      },
    );
    expect(upsertEmailConfig).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      logoAssetUrl: MOCK_EMAIL_LOGO_URL,
    });
  });

  it('stores a per-template logo under a path naming the template', async () => {
    vi.mocked(put).mockResolvedValue(
      mockPutBlobResult({ url: MOCK_TEMPLATE_LOGO_URL }),
    );

    const result = await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TEMPLATE_TARGET,
      buildLogoFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_TEMPLATE_LOGO_URL,
    });
    expect(put).toHaveBeenCalledWith(
      `tenants/${MOCK_TENANT_ID}/email-logo-magic_link.png`,
      MOCK_VALID_ASSET.buffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: MOCK_VALID_ASSET.contentType,
        token: MOCK_BLOB_TOKEN,
      },
    );
    expect(upsertEmailTemplate).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: MOCK_TEMPLATE_LOGO_URL },
    );
  });

  it('returns the validation error without calling Blob when validation fails', async () => {
    vi.mocked(validateEmailLogoUpload).mockResolvedValue(
      errorResult({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.EMAIL_LOGO_SVG,
      }),
    );

    const result = await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TENANT_TARGET,
      buildLogoFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.EMAIL_LOGO_SVG,
    });
    expect(put).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it('records one settings-updated audit event identifying the target', async () => {
    mockedAuth.mockResolvedValueOnce(MOCK_OPERATOR_SESSION);

    await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TENANT_TARGET,
      buildLogoFormData(),
    );

    expect(insertAuditEvent).toHaveBeenCalledTimes(1);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: {
        target: TENANT_TARGET,
        operation: 'upload',
        url: MOCK_EMAIL_LOGO_URL,
      },
    });
  });

  it('reports a server error and records no audit event when the write fails', async () => {
    vi.mocked(upsertEmailConfig).mockRejectedValue(MOCK_DB_ERROR);

    const result = await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TENANT_TARGET,
      buildLogoFormData(),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it('refuses without touching Blob when the Blob token is unconfigured', async () => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: undefined });

    const result = await uploadEmailLogoAction(
      MOCK_TENANT_ID,
      TENANT_TARGET,
      buildLogoFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
    });
    expect(put).not.toHaveBeenCalled();
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (gateError) => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(gateError),
    );

    await expect(
      uploadEmailLogoAction(MOCK_TENANT_ID, TENANT_TARGET, buildLogoFormData()),
    ).rejects.toThrow(gateError);

    expect(put).not.toHaveBeenCalled();
  });
});
