import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  EMAIL_TEMPLATE_TYPE,
} from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
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

Object.assign(env, { BLOB_READ_WRITE_TOKEN: 'test-token' });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const makeFormData = (file: File | null): FormData => {
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
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    });
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getEmailConfigMock.mockResolvedValue(undefined);
    getEmailTemplateMock.mockResolvedValue({ logoAssetUrl: undefined });
    validateEmailLogoUploadMock.mockResolvedValue({
      ok: true,
      asset: VALID_ASSET,
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/email-logo-new.png',
    });
    upsertEmailConfigMock.mockResolvedValue({});
  });

  it('uploads and persists the tenant email logo at a path distinct from the site logo', async () => {
    const result = await uploadEmailLogoAction(
      'tenant-1',
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/email-logo-new.png',
    });
    expect(putMock).toHaveBeenCalledWith(
      'tenants/tenant-1/email-logo.png',
      VALID_ASSET.buffer,
      expect.objectContaining({ access: 'public' }),
    );
    expect(upsertEmailConfigMock).toHaveBeenCalledWith('tenant-1', {
      logoAssetUrl:
        'https://example.blob.vercel-storage.com/email-logo-new.png',
    });
  });

  it('uploads and persists a per-template logo at a path naming the template', async () => {
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/email-logo-magic-link.png',
    });
    upsertEmailTemplateMock.mockResolvedValue({});

    const result = await uploadEmailLogoAction(
      'tenant-1',
      { type: 'template', templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result.ok).toBe(true);
    expect(putMock).toHaveBeenCalledWith(
      'tenants/tenant-1/email-logo-magic_link.png',
      VALID_ASSET.buffer,
      expect.objectContaining({ access: 'public' }),
    );
    expect(upsertEmailTemplateMock).toHaveBeenCalledWith(
      'tenant-1',
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      {
        logoAssetUrl:
          'https://example.blob.vercel-storage.com/email-logo-magic-link.png',
      },
    );
  });

  it('returns the validation error and never calls Blob when validation fails', async () => {
    validateEmailLogoUploadMock.mockResolvedValue({
      ok: false,
      error: 'SVG logos are not supported.',
    });

    const result = await uploadEmailLogoAction(
      'tenant-1',
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.svg', { type: 'image/svg+xml' })),
    );

    expect(result).toEqual({
      ok: false,
      error: 'SVG logos are not supported.',
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records exactly one SETTINGS_UPDATED audit event identifying the target', async () => {
    await uploadEmailLogoAction(
      'tenant-1',
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'operator-1',
      actorEmail: 'operator@example.com',
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: 'tenant-1',
      details: {
        target: { type: 'tenant' },
        operation: 'upload',
        url: 'https://example.blob.vercel-storage.com/email-logo-new.png',
      },
    });
  });

  it('records no audit event when the write itself fails', async () => {
    upsertEmailConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await uploadEmailLogoAction(
      'tenant-1',
      { type: 'tenant' },
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: false,
      error: "Couldn't upload the logo — try again.",
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports a readable error and never touches Blob when the token is unconfigured', async () => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: undefined });

    try {
      const result = await uploadEmailLogoAction(
        'tenant-1',
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      );

      expect(result).toEqual({
        ok: false,
        error: 'File uploads are not configured for this environment yet.',
      });
      expect(putMock).not.toHaveBeenCalled();
    } finally {
      Object.assign(env, { BLOB_READ_WRITE_TOKEN: 'test-token' });
    }
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      uploadEmailLogoAction(
        'tenant-1',
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(putMock).not.toHaveBeenCalled();
  });

  it('propagates the 404 the tenant gate throws when the session has no membership', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    await expect(
      uploadEmailLogoAction(
        'tenant-1',
        { type: 'tenant' },
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(putMock).not.toHaveBeenCalled();
  });
});
