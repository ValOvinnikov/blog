import { OAUTH_PROVIDER, TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { SIGN_IN_APPS_MODE } from '@platform/constants/sign-in-apps';
import {
  MOCK_CLIENT_ID,
  MOCK_GOOGLE_CALLBACK_URL,
  MOCK_MASKED_CLIENT_ID,
  mockOAuthClient,
} from '@platform/testing/sign-in-apps/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_CUSTOM_DOMAIN,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { loadSignInApps } from './load-sign-in-apps';

vi.mock('@blog/db', async () => {
  const { mockSignInAppsDb } =
    await import('@platform/testing/sign-in-apps/fixtures');
  return mockSignInAppsDb();
});

const growthTenant = (overrides: Partial<TTenant> = {}) =>
  mockTenant({ plan: TENANT_PLAN.GROWTH, ...overrides });

const { listTenantOAuthClients } = queries.tenantOAuthCredentials;

const googleOf = async (
  mode: Parameters<typeof loadSignInApps>[1],
  tenant = growthTenant(),
) =>
  (await loadSignInApps(tenant, mode)).find(
    (app) => app.provider === OAUTH_PROVIDER.GOOGLE,
  );

describe(loadSignInApps, () => {
  beforeEach(() => {
    vi.mocked(listTenantOAuthClients)
      .mockReset()
      .mockResolvedValue([mockOAuthClient()]);
  });

  it('lists Google then GitHub, each with the callback on the main address', async () => {
    vi.mocked(listTenantOAuthClients).mockResolvedValue([]);

    const apps = await loadSignInApps(growthTenant(), SIGN_IN_APPS_MODE.EDIT);

    expect(apps.map(({ provider }) => provider)).toEqual([
      OAUTH_PROVIDER.GOOGLE,
      OAUTH_PROVIDER.GITHUB,
    ]);
    expect(apps[0]).toEqual({
      provider: OAUTH_PROVIDER.GOOGLE,
      hasOwnApp: false,
      hasKeptApp: false,
      callbackUrl: MOCK_GOOGLE_CALLBACK_URL,
      hasCallbackWarning: false,
    });
  });

  it('gives the owner the full client ID', async () => {
    expect(await googleOf(SIGN_IN_APPS_MODE.EDIT)).toMatchObject({
      hasOwnApp: true,
      clientId: MOCK_CLIENT_ID,
    });
  });

  it('gives a read-only viewer only the masked client ID', async () => {
    const app = await googleOf(SIGN_IN_APPS_MODE.READ_ONLY);

    expect(app).toMatchObject({ maskedClientId: MOCK_MASKED_CLIENT_ID });
    expect(app).not.toHaveProperty('clientId');
  });

  it.each([SIGN_IN_APPS_MODE.OPERATOR, SIGN_IN_APPS_MODE.FREE])(
    'gives the %s view no client ID at all',
    async (mode) => {
      const app = await googleOf(mode);

      expect(app).not.toHaveProperty('clientId');
      expect(app).not.toHaveProperty('maskedClientId');
    },
  );

  it('shows a downgraded site’s saved app as kept, not in use, with no client ID', async () => {
    const app = await googleOf(
      SIGN_IN_APPS_MODE.OPERATOR,
      mockTenant({ plan: TENANT_PLAN.FREE }),
    );

    expect(app).toMatchObject({ hasOwnApp: false, hasKeptApp: true });
    expect(app).not.toHaveProperty('maskedClientId');
  });

  it('warns when the app was registered against an earlier main address', async () => {
    vi.mocked(listTenantOAuthClients).mockResolvedValue([
      mockOAuthClient({ callbackDomain: MOCK_CUSTOM_DOMAIN }),
    ]);

    expect(await googleOf(SIGN_IN_APPS_MODE.EDIT)).toMatchObject({
      hasCallbackWarning: true,
    });
  });

  it.each([
    [
      'an unrecorded callback domain',
      null,
      SIGN_IN_APPS_MODE.EDIT,
      growthTenant(),
    ],
    [
      'an operator',
      MOCK_CUSTOM_DOMAIN,
      SIGN_IN_APPS_MODE.OPERATOR,
      growthTenant(),
    ],
    [
      'an archived site',
      MOCK_CUSTOM_DOMAIN,
      SIGN_IN_APPS_MODE.READ_ONLY,
      growthTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    ],
  ])('does not warn for %s', async (_name, callbackDomain, mode, tenant) => {
    vi.mocked(listTenantOAuthClients).mockResolvedValue([
      mockOAuthClient({ callbackDomain }),
    ]);

    expect(await googleOf(mode, tenant)).toMatchObject({
      hasCallbackWarning: false,
    });
  });
});
