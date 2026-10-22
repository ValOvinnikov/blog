import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { OPERATOR_EMAIL, OPERATOR_ID } from '@platform/testing/admins/operator';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { uploadEmailLogoAction } from './upload-email-logo-action';

const {
  getEmailConfigMock,
  getEmailTemplateMock,
  upsertEmailConfigMock,
  upsertEmailTemplateMock,
  validateEmailLogoUploadMock,
  insertAuditEventMock,
  putMock,
  delMock,
} = vi.hoisted(() => ({
  getEmailConfigMock: vi.fn(),
  getEmailTemplateMock: vi.fn(),
  upsertEmailConfigMock: vi.fn(),
  upsertEmailTemplateMock: vi.fn(),
  validateEmailLogoUploadMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  putMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/email/validate-email-logo', () => ({
  validateEmailLogoUpload: validateEmailLogoUploadMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    emailConfig: {
      getEmailConfig: getEmailConfigMock,
      upsertEmailConfig: upsertEmailConfigMock,
    },
    emailTemplates: {
      getEmailTemplate: getEmailTemplateMock,
      upsertEmailTemplate: upsertEmailTemplateMock,
    },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('@vercel/blob', () => ({ put: putMock, del: delMock }));

vi.mock('@platform/utils/env/env');

const BLOB_TOKEN = 'test-token';
const TENANT_LOGO_URL =
  'https://example.blob.vercel-storage.com/email-logo-new.png';
const TEMPLATE_LOGO_URL =
  'https://example.blob.vercel-storage.com/email-logo-magic-link.png';

Object.assign(env, { BLOB_READ_WRITE_TOKEN: BLOB_TOKEN });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const makeFormData = (file: TMaybeNull<File>): FormData => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return formData;
};

const VALID_ASSET = {
  buffer: Buffer.from('bytes'),
  contentType: 'image/png',
  extension: 'png',
};

describe(uploadEmailLogoAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    getEmailConfigMock.mockReset();
    getEmailTemplateMock.mockReset();
    upsertEmailConfigMock.mockReset();
    upsertEmailTemplateMock.mockReset();
    validateEmailLogoUploadMock.mockReset();
    insertAuditEventMock.mockReset();
    putMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: TENANT_ID },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });
    validateEmailLogoUploadMock.mockResolvedValue({
      ok: true,
      asset: VALID_ASSET,
    });
    putMock.mockResolvedValue({
      url: TENANT_LOGO_URL,
    });
    upsertEmailConfigMock.mockResolvedValue({});
  });

  it('uploads and persists the tenant email logo at a path distinct from the site logo', async () => {
    const result = await uploadEmailLogoAction(
      TENANT_ID,
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: TENANT_LOGO_URL,
    });
    expect(putMock).toHaveBeenCalledWith(
      `tenants/${TENANT_ID}/email-logo.png`,
      VALID_ASSET.buffer,
      expect.objectContaining({ access: 'public' }),
    );
    expect(upsertEmailConfigMock).toHaveBeenCalledWith(TENANT_ID, {
      logoAssetUrl: TENANT_LOGO_URL,
    });
  });

  it('uploads and persists a per-template logo at a path naming the template', async () => {
    putMock.mockResolvedValue({
      url: TEMPLATE_LOGO_URL,
    });
    upsertEmailTemplateMock.mockResolvedValue({});

    const result = await uploadEmailLogoAction(
      TENANT_ID,
      { type: 'template', templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(putMock).toHaveBeenCalledWith(
      `tenants/${TENANT_ID}/email-logo-magic_link.png`,
      VALID_ASSET.buffer,
      expect.objectContaining({ access: 'public' }),
    );
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      TENANT_ID,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      {
        logoAssetUrl: TEMPLATE_LOGO_URL,
      },
    );
  });

  it('returns the validation error and never calls Blob when validation fails', async () => {
    validateEmailLogoUploadMock.mockResolvedValue({
      ok: false,
      error: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.EMAIL_LOGO_SVG,
      },
    });

    const result = await uploadEmailLogoAction(
      TENANT_ID,
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.svg', { type: 'image/svg+xml' })),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.EMAIL_LOGO_SVG,
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records exactly one SETTINGS_UPDATED audit event identifying the target', async () => {
    await uploadEmailLogoAction(
      TENANT_ID,
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: TENANT_ID,
      details: {
        target: { type: 'tenant' },
        operation: 'upload',
        url: TENANT_LOGO_URL,
      },
    });
  });

  it('records no audit event when the write itself fails', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await uploadEmailLogoAction(
      TENANT_ID,
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports a readable error and never touches Blob when the token is unconfigured', async () => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: undefined });

    try {
      const result = await uploadEmailLogoAction(
        TENANT_ID,
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
      });
      expect(putMock).not.toHaveBeenCalled();
    } finally {
      Object.assign(env, { BLOB_READ_WRITE_TOKEN: BLOB_TOKEN });
    }
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      uploadEmailLogoAction(
        TENANT_ID,
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(putMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(
      uploadEmailLogoAction(
        TENANT_ID,
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(putMock).not.toHaveBeenCalled();
  });
});
