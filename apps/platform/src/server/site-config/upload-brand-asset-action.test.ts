import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { auth } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { revalidateSiteConfig } from '@platform/server/site-config/revalidate-site-config';
import { getSiteConfigOrDefaults } from '@platform/server/site-config/site-config-or-defaults';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import { MOCK_BLOB_TOKEN } from '@platform/testing/blob/fixtures';
import {
  MOCK_LOGO_URL,
  MOCK_THEME_FIELDS,
  mockSiteConfigThemeAndAssets,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { uploadBrandAssetAction } from './upload-brand-asset-action';

faker.seed(5998);

const {
  validateBrandAssetUploadMock,
  upsertSiteConfigMock,
  insertAuditEventMock,
  putMock,
  delMock,
} = vi.hoisted(() => ({
  validateBrandAssetUploadMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  putMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/server/site-config/site-config-or-defaults');

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

const BRAND_ASSET_KIND = { LOGO: 'logo', FAVICON: 'favicon' } as const;
const LOGO_KIND = BRAND_ASSET_KIND.LOGO;
const FAVICON_KIND = BRAND_ASSET_KIND.FAVICON;
const MOCK_CONTENT_TYPE = 'image/png';
const MOCK_FILE_NAME = faker.system.commonFileName('png');
const MOCK_UPLOADED_URL = faker.internet.url();
const MOCK_NEW_URL = faker.internet.url();
const MOCK_VALIDATED_UPLOAD = {
  buffer: Buffer.from(faker.lorem.word()),
  contentType: MOCK_CONTENT_TYPE,
  extension: 'png',
};
const MOCK_BLOB_ERROR_MESSAGE = faker.lorem.words(3);
const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const mockFormData = (file: TMaybeNull<File>): FormData => {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return formData;
};

const mockImageFormData = (): FormData =>
  mockFormData(new File(['x'], MOCK_FILE_NAME, { type: MOCK_CONTENT_TYPE }));

describe(uploadBrandAssetAction, () => {
  beforeEach(() => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    vi.mocked(getSiteConfigOrDefaults).mockReset();
    validateBrandAssetUploadMock.mockReset();
    validateBrandAssetUploadMock.mockResolvedValue(
      okResult(MOCK_VALIDATED_UPLOAD),
    );
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    putMock.mockReset();
    putMock.mockResolvedValue({ url: MOCK_UPLOADED_URL });
    delMock.mockReset();
  });

  it('re-resolves the tenant from the session before touching Blob or the db', async () => {
    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('rejects when no file is present in the form data', async () => {
    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockFormData(null),
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
      FAVICON_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.BRAND_IMAGE_TYPE_UNSUPPORTED,
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('uploads under a unique tenant-scoped name and returns the new logo URL', async () => {
    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_UPLOADED_URL,
    });
    expect(putMock).toHaveBeenCalledWith(
      `tenants/${MOCK_TENANT_ID}/${LOGO_KIND}.${MOCK_VALIDATED_UPLOAD.extension}`,
      MOCK_VALIDATED_UPLOAD.buffer,
      {
        access: 'public',
        addRandomSuffix: true,
        contentType: MOCK_CONTENT_TYPE,
        token: MOCK_BLOB_TOKEN,
      },
    );
  });

  it('saves the theme fields plus the new logo URL', async () => {
    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: MOCK_UPLOADED_URL,
    });
  });

  it('refreshes the public site for the tenant once the new URL is saved', async () => {
    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      FAVICON_KIND,
      mockImageFormData(),
    );

    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('records one SETTINGS_UPDATED audit event naming the asset and operation', async () => {
    await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: {
        asset: LOGO_KIND,
        operation: 'upload',
        url: MOCK_UPLOADED_URL,
      },
    });
  });

  it('deletes the previous asset after a replace without blocking the result', async () => {
    vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
      mockSiteConfigThemeAndAssets({ logoAssetUrl: MOCK_LOGO_URL }),
    );
    putMock.mockResolvedValue({ url: MOCK_NEW_URL });
    delMock.mockRejectedValue(new Error(MOCK_BLOB_ERROR_MESSAGE));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_NEW_URL,
    });
    expect(delMock).toHaveBeenCalledWith(MOCK_LOGO_URL, {
      token: MOCK_BLOB_TOKEN,
    });
  });

  it('reports failure with no site config write when the Blob upload throws', async () => {
    putMock.mockRejectedValue(new Error(MOCK_BLOB_ERROR_MESSAGE));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('records no audit event and skips the site refresh when the save fails', async () => {
    upsertSiteConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('reports a readable error and never touches Blob when the token is missing', async () => {
    Object.assign(env, { BLOB_READ_WRITE_TOKEN: undefined });

    const result = await uploadBrandAssetAction(
      MOCK_TENANT_ID,
      LOGO_KIND,
      mockImageFormData(),
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.UPLOADS_NOT_CONFIGURED,
    });
    expect(validateBrandAssetUploadMock).not.toHaveBeenCalled();
    expect(putMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (navigationError) => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      throw new Error(navigationError);
    });

    await expect(
      uploadBrandAssetAction(MOCK_TENANT_ID, LOGO_KIND, mockImageFormData()),
    ).rejects.toThrow(navigationError);

    expect(putMock).not.toHaveBeenCalled();
  });
});
