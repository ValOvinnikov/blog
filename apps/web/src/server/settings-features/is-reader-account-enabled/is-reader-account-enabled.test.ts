import { CAPABILITY, type TCapability } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { mockSettingsFeaturesRowEnabling } from '@web/testing/server/settings-features/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

import {
  isReaderAccountEnabled,
  isReaderAccountEnabledForTenant,
  isReaderAccountFeatureEnabled,
} from './is-reader-account-enabled';

faker.seed(6010);

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/tenant/request-tenant/request-tenant');

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual('@blog/db/constants')),
  queries: {
    tenants: { getTenantById: vi.fn() },
    settingsFeatures: { getSettingsFeatures: vi.fn() },
    siteConfig: { getSiteConfig: vi.fn() },
  },
}));

vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);

const enableOnly = (...capabilities: TCapability[]) => {
  vi.mocked(queries.settingsFeatures.getSettingsFeatures).mockResolvedValue(
    mockSettingsFeaturesRowEnabling(capabilities),
  );
};

beforeEach(() => {
  vi.mocked(queries.tenants.getTenantById).mockReset();
  vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
    mockTenant({ plan: TENANT_PLAN.GROWTH }),
  );
  vi.mocked(queries.settingsFeatures.getSettingsFeatures).mockReset();
});

describe(isReaderAccountEnabled, () => {
  it('is enabled when Reader accounts is on', async () => {
    enableOnly(CAPABILITY.READER_ACCOUNTS);

    await expect(isReaderAccountEnabled()).resolves.toBe(true);
  });

  it('is disabled when Reader accounts is off, whatever else is on', async () => {
    enableOnly(
      CAPABILITY.BOOKMARKS,
      CAPABILITY.COMMENTS,
      CAPABILITY.RATINGS,
      CAPABILITY.NEWSLETTER,
    );

    await expect(isReaderAccountEnabled()).resolves.toBe(false);
  });

  it('is disabled on a Free site with Reader accounts on', async () => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.FREE }),
    );
    enableOnly(CAPABILITY.READER_ACCOUNTS);

    await expect(isReaderAccountEnabled()).resolves.toBe(false);
  });
});

describe(isReaderAccountEnabledForTenant, () => {
  describe('with Reader accounts on', () => {
    beforeEach(() => {
      enableOnly(CAPABILITY.READER_ACCOUNTS);
    });

    it('is enabled', async () => {
      await expect(
        isReaderAccountEnabledForTenant(MOCK_TENANT_ID),
      ).resolves.toBe(true);
    });

    it('reads the named tenant', async () => {
      await isReaderAccountEnabledForTenant(MOCK_TENANT_ID);

      expect(queries.tenants.getTenantById).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        expect.anything(),
      );
    });
  });

  it('is disabled for a tenant with Reader accounts off', async () => {
    enableOnly(CAPABILITY.BOOKMARKS);

    await expect(isReaderAccountEnabledForTenant(MOCK_TENANT_ID)).resolves.toBe(
      false,
    );
  });
});

describe(isReaderAccountFeatureEnabled, () => {
  it('is enabled when both Reader accounts and the feature are on', async () => {
    enableOnly(CAPABILITY.READER_ACCOUNTS, CAPABILITY.BOOKMARKS);

    await expect(
      isReaderAccountFeatureEnabled(CAPABILITY.BOOKMARKS),
    ).resolves.toBe(true);
  });

  it.each<[string, TCapability[]]>([
    ['Reader accounts is off', [CAPABILITY.BOOKMARKS]],
    ['the feature is off', [CAPABILITY.READER_ACCOUNTS]],
  ])('is disabled when %s', async (_, enabled) => {
    enableOnly(...enabled);

    await expect(
      isReaderAccountFeatureEnabled(CAPABILITY.BOOKMARKS),
    ).resolves.toBe(false);
  });
});
