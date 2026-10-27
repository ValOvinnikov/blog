import {
  CAPABILITY,
  READER_ACCOUNT_CAPABILITIES,
  type TCapability,
} from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { mockSettingsFeaturesRowEnabling } from '@web/testing/server/settings-features/fixtures';
import { mockTenant } from '@web/testing/shared/tenant/fixtures';

import { isReaderAccountEnabled } from './is-reader-account-enabled';

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

describe(isReaderAccountEnabled, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );
    vi.mocked(queries.settingsFeatures.getSettingsFeatures).mockReset();
  });

  it.each(READER_ACCOUNT_CAPABILITIES)(
    'is enabled when %s is the only reader-account capability enabled',
    async (capability) => {
      enableOnly(capability);

      await expect(isReaderAccountEnabled()).resolves.toBe(true);
    },
  );

  it('is disabled when only capabilities that need no reader account are enabled', async () => {
    enableOnly(
      CAPABILITY.RATINGS,
      CAPABILITY.ANALYTICS,
      CAPABILITY.CONSENT_BANNER,
    );

    await expect(isReaderAccountEnabled()).resolves.toBe(false);
  });
});
