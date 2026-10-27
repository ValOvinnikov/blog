import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { faker } from '@faker-js/faker';
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
  MOCK_FAVICON_URL,
  MOCK_LOGO_URL,
  MOCK_THEME_FIELDS,
  mockSiteConfigThemeAndAssets,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';
import type { Session } from 'next-auth';

import { clearBrandAssetAction } from './clear-brand-asset-action';

faker.seed(5998);

const { upsertSiteConfigMock, insertAuditEventMock, delMock } = vi.hoisted(
  () => ({
    upsertSiteConfigMock: vi.fn(),
    insertAuditEventMock: vi.fn(),
    delMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/site-config/revalidate-site-config');

vi.mock('@platform/server/site-config/site-config-or-defaults');

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { upsertSiteConfig: upsertSiteConfigMock },
    auditEvents: { insertAuditEvent: insertAuditEventMock },
  },
}));

vi.mock('@vercel/blob', () => ({
  del: delMock,
}));

vi.mock('@platform/utils/env/env');

Object.assign(env, { BLOB_READ_WRITE_TOKEN: MOCK_BLOB_TOKEN });

const BRAND_ASSET_KIND = { LOGO: 'logo', FAVICON: 'favicon' } as const;
const LOGO_KIND = BRAND_ASSET_KIND.LOGO;
const FAVICON_KIND = BRAND_ASSET_KIND.FAVICON;

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const MOCK_DB_ERROR_MESSAGE = faker.lorem.words(3);

describe(clearBrandAssetAction, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    upsertSiteConfigMock.mockReset();
    insertAuditEventMock.mockReset();
    delMock.mockReset();
    vi.mocked(getSiteConfigOrDefaults).mockReset();
  });

  it('re-resolves the tenant from the session before writing', async () => {
    await clearBrandAssetAction(MOCK_TENANT_ID, FAVICON_KIND);

    expect(requireTenantMembership).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it.each([
    {
      kind: LOGO_KIND,
      stored: { logoAssetUrl: MOCK_LOGO_URL },
      cleared: { logoAssetUrl: null },
      blobUrl: MOCK_LOGO_URL,
    },
    {
      kind: FAVICON_KIND,
      stored: { faviconAssetUrl: MOCK_FAVICON_URL },
      cleared: { faviconAssetUrl: null },
      blobUrl: MOCK_FAVICON_URL,
    },
  ])(
    'nulls the $kind column and deletes the stored blob',
    async ({ kind, stored, cleared, blobUrl }) => {
      vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
        mockSiteConfigThemeAndAssets(stored),
      );

      const result = await clearBrandAssetAction(MOCK_TENANT_ID, kind);

      expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(upsertSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        ...MOCK_THEME_FIELDS,
        ...cleared,
      });
      expect(delMock).toHaveBeenCalledWith(blobUrl, {
        token: MOCK_BLOB_TOKEN,
      });
    },
  );

  it('refreshes the public site for the tenant once the field is cleared', async () => {
    vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
      mockSiteConfigThemeAndAssets({ logoAssetUrl: MOCK_LOGO_URL }),
    );

    await clearBrandAssetAction(MOCK_TENANT_ID, LOGO_KIND);

    expect(revalidateSiteConfig).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('records one SETTINGS_UPDATED audit event naming the asset and operation', async () => {
    vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
      mockSiteConfigThemeAndAssets({ faviconAssetUrl: MOCK_FAVICON_URL }),
    );

    await clearBrandAssetAction(MOCK_TENANT_ID, FAVICON_KIND);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
      targetId: MOCK_TENANT_ID,
      details: { asset: FAVICON_KIND, operation: 'clear' },
    });
  });

  it('is a no-op success when the field is already empty', async () => {
    const result = await clearBrandAssetAction(MOCK_TENANT_ID, FAVICON_KIND);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it('reports failure with no audit event or site refresh when the write fails', async () => {
    vi.mocked(getSiteConfigOrDefaults).mockResolvedValue(
      mockSiteConfigThemeAndAssets({ faviconAssetUrl: MOCK_FAVICON_URL }),
    );
    upsertSiteConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await clearBrandAssetAction(MOCK_TENANT_ID, FAVICON_KIND);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(revalidateSiteConfig).not.toHaveBeenCalled();
  });

  it.each([
    NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
  ])('propagates the %s the tenant gate throws', async (navigationError) => {
    vi.mocked(requireTenantMembership).mockImplementationOnce(() => {
      throw new Error(navigationError);
    });

    await expect(
      clearBrandAssetAction(MOCK_TENANT_ID, LOGO_KIND),
    ).rejects.toThrow(navigationError);

    expect(upsertSiteConfigMock).not.toHaveBeenCalled();
  });
});
