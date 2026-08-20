import { env } from '@admin/utils/env/env';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';

import { uploadBrandAssetAction } from './upload-brand-asset-action';

const {
  requireTenantMembershipMock,
  authMock,
  getSiteConfigOrDefaultsMock,
  validateBrandAssetUploadMock,
  upsertSiteConfigMock,
  insertAuditEventMock,
  putMock,
  delMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  authMock: vi.fn(),
  getSiteConfigOrDefaultsMock: vi.fn(),
  validateBrandAssetUploadMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  putMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@admin/server/site-config/site-config-or-defaults', () => ({
  getSiteConfigOrDefaults: getSiteConfigOrDefaultsMock,
}));

vi.mock('@admin/server/site-config/validate-brand-asset', () => ({
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

vi.mock('@admin/utils/env/env', () => ({
  env: { BLOB_READ_WRITE_TOKEN: 'test-token' },
}));

const THEME_FIELDS = {
  preset: PRESET_ID.CONSOLE,
  accentHue: 250,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.MD,
  density: DENSITY.DEFAULT,
};

function makeFormData(file: File | null): FormData {
  const formData = new FormData();
  if (file) formData.append('file', file);
  return formData;
}

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
      tenant: { id: 'tenant-1', slug: 'acme' },
      membership: { role: 'OWNER' },
    });
    authMock.mockResolvedValue({
      user: { id: 'operator-1', email: 'operator@example.com' },
    });
    insertAuditEventMock.mockResolvedValue({ id: 'event-1' });
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
  });

  it('re-resolves the tenant from the session before touching Blob or the db', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: false,
      error: 'nope',
    });

    await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('acme');
  });

  it('rejects when no file is present in the form data', async () => {
    const result = await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(null),
    );

    expect(result).toEqual({ ok: false, error: 'Choose a file to upload.' });
    expect(putMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('returns the validation error and never calls Blob when validation fails', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: false,
      error: 'Favicon must be a square image.',
    });

    const result = await uploadBrandAssetAction(
      'acme',
      'favicon',
      makeFormData(new File(['x'], 'favicon.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: false,
      error: 'Favicon must be a square image.',
    });
    expect(putMock).not.toHaveBeenCalled();
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('uploads, saves the theme fields plus the new logo URL, and returns it', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: true,
      asset: {
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      },
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/logo-abc.png',
    });
    upsertSiteConfigMock.mockResolvedValue({});

    const result = await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: true,
      url: 'https://example.blob.vercel-storage.com/logo-abc.png',
    });
    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', {
      ...THEME_FIELDS,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo-abc.png',
    });
  });

  it('records exactly one SETTINGS_UPDATED audit event identifying the asset and operation', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: true,
      asset: {
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      },
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/logo-abc.png',
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await uploadBrandAssetAction(
      'acme',
      'logo',
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
        asset: 'logo',
        operation: 'upload',
        url: 'https://example.blob.vercel-storage.com/logo-abc.png',
      },
    });
  });

  it('deletes the previous asset after a successful replace, without blocking the result on it', async () => {
    getSiteConfigOrDefaultsMock.mockResolvedValue({
      ...THEME_FIELDS,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo-old.png',
      faviconAssetUrl: undefined,
    });
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: true,
      asset: {
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      },
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/logo-new.png',
    });
    upsertSiteConfigMock.mockResolvedValue({});
    delMock.mockRejectedValue(new Error('blob unavailable'));

    const result = await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result.ok).toBe(true);
    expect(delMock).toHaveBeenCalledWith(
      'https://example.blob.vercel-storage.com/logo-old.png',
      { token: 'test-token' },
    );
  });

  it('leaves the site_config write untouched and reports failure when the Blob upload itself throws', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: true,
      asset: {
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      },
    });
    putMock.mockRejectedValue(new Error('blob store unavailable'));

    const result = await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: false,
      error: "Couldn't upload the logo — try again.",
    });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('records no audit event when the site_config write itself fails', async () => {
    validateBrandAssetUploadMock.mockResolvedValue({
      ok: true,
      asset: {
        buffer: Buffer.from('bytes'),
        contentType: 'image/png',
        extension: 'png',
      },
    });
    putMock.mockResolvedValue({
      url: 'https://example.blob.vercel-storage.com/logo-abc.png',
    });
    upsertSiteConfigMock.mockRejectedValue(new Error('db unavailable'));

    const result = await uploadBrandAssetAction(
      'acme',
      'logo',
      makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
    );

    expect(result).toEqual({
      ok: false,
      error: "Couldn't upload the logo — try again.",
    });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('reports a readable error and never touches Blob when the token is unconfigured', async () => {
    // @ts-expect-error -- the mocked env module is a plain mutable object
    env.BLOB_READ_WRITE_TOKEN = undefined;

    try {
      const result = await uploadBrandAssetAction(
        'acme',
        'logo',
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      );

      expect(result).toEqual({
        ok: false,
        error: 'File uploads are not configured for this environment yet.',
      });
      expect(validateBrandAssetUploadMock).not.toHaveBeenCalled();
      expect(putMock).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    } finally {
      // @ts-expect-error -- restore the mocked env module for later tests
      env.BLOB_READ_WRITE_TOKEN = 'test-token';
    }
  });

  it('propagates the unauthenticated/unauthorized redirect the tenant gate throws', async () => {
    requireTenantMembershipMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(
      uploadBrandAssetAction(
        'acme',
        'logo',
        makeFormData(new File(['x'], 'logo.png', { type: 'image/png' })),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(putMock).not.toHaveBeenCalled();
  });
});
