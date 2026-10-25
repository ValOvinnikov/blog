import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { MOCK_BLOB_TOKEN } from '@platform/testing/blob/fixtures';
import { MOCK_THEME_FIELDS } from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { uploadBrandAssetAction } from './upload-brand-asset-action';

const {
  getSiteConfigOrDefaultsMock,
  validateBrandAssetUploadMock,
  upsertSiteConfigMock,
  insertAuditEventMock,
  putMock,
  delMock,
} = vi.hoisted(() => ({
  getSiteConfigOrDefaultsMock: vi.fn(),
  validateBrandAssetUploadMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  putMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@platform/server/site-config/validate-brand-asset', () => ({
  validateBrandAssetUpload: validateBrandAssetUploadMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('@vercel/blob', () => ({
  put: putMock,
  del: delMock,
}));

vi.mock('@platform/utils/env/env');

const UPLOADED_LOGO_URL =
  'https://example.blob.vercel-storage.com/logo-abc.png';
const PREVIOUS_LOGO_URL =
  'https://example.blob.vercel-storage.com/logo-old.png';

Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);
const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const makeFormData = (file: TMaybeNull<File>): FormData => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return formData;
};

describe(uploadBrandAssetAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    authMock.mockReset();
    getSiteConfigOrDefaultsMock.mockReset();
    validateBrandAssetUploadMock.mockReset();
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    putMock.mockReset();
    delMock.mockReset();

    requireTenantMembershipMock.mockResolvedValue({
      tenant: { id: MOCK_TENANT_ID },
      membership: { role: MEMBERSHIP_ROLE.OWNER },
    });
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    validateBrandAssetUploadMock.mockResolvedValue(
      okResult({
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      }),
    );
    putMock.mockResolvedValue({
      url: UPLOADED_LOGO_URL,
    });
    upsertSiteConfigMock.mockResolvedValue({});
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
  });

  it('re-resolves the tenant from the session before touching Blob or the db', async () => {
    validateBrandAssetUploadMock.mockResolvedValue(
      errorResult({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UNREADABLE_IMAGE,
      }),
    );

    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(requireTenantMembershipMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('rejects when no file is present in the form data', async () => {
    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(null),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_MISSING,
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns the validation error and never calls Blob when validation fails', async () => {
    validateBrandAssetUploadMock.mockResolvedValue(
      errorResult({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED,
      }),
    );

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'favicon',
      makeFormData(new File(['x'], 'favicon.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED,
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('uploads under a unique name, saves the theme fields plus the new logo URL, and returns it', async () => {
    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: UPLOADED_LOGO_URL,
    });
    expect(putMock).toHaveBeenCalledWith(
      `tenants/${MOCK_TENANT_ID}/logo.png`,
      expect.any(Buffer),
      expect.objectContaining({ addRandomSuffix: true }),
    );
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: UPLOADED_LOGO_URL,
    });
  });

  it('records one SETTINGS_UPDATED audit event naming the asset and operation', async () => {
    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: {
        asset: 'logo',
        operation: 'upload',
        url: UPLOADED_LOGO_URL,
      },
    });
  });

  it('deletes the previous asset after a replace, without blocking the result on it', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: PREVIOUS_LOGO_URL,
      faviconAssetUrl: undefined,
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/logo-new.png',
    });
    delMock.mockRejectedValue(new Error('blob unavailable'));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result.outcome).toBe(ACTION_OUTCOME.SUCCESS);
    expect(delMock).toHaveBeenCalledWith(PREVIOUS_LOGO_URL, {
      token: MOCK_BLOB_TOKEN,
    });
  });

  it('reports failure with no site_config write when the Blob upload throws', async () => {
    putMock.mockRejectedValue(new Error('blob store unavailable'));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event when the site_config write itself fails', async () => {
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports a readable error and never touches Blob when the token is unconfigured', async () => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: undefined });

    try {
      const result = await uploadBrandAssetAction(
        MOCK_TENANT_ID,
        'logo',
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      );

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
      });
      expect(validateBrandAssetUploadMock).not.toHaveBeenCalled();
      expect(putMock).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    } finally {
      Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });
    }
  });

  it('propagates the sign-in redirect the tenant gate throws when unauthenticated', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });

    await expect(
      uploadBrandAssetAction(
        MOCK_TENANT_ID,
        'logo',
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
      uploadBrandAssetAction(
        MOCK_TENANT_ID,
        'logo',
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(putMock).not.toHaveBeenCalled();
  });
});
