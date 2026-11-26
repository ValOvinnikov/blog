import {
  PRESET_ID,
  resolveTenantEmailBrand,
  resolveTenantEmailDarkBrand,
} from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MOCK_YELLOW_HEX } from '@shinefold/config/testing/button-colors';
import {
  getSiteConfig,
  type TSiteConfigResult,
} from '@shinefold/db/queries/site-config';
import { getTenantEntitlements } from '@shinefold/db/queries/tenant-entitlement-grants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { MOCK_ACCENT_HUE } from '@shinefold/db/testing/site-config/fixtures';
import { resolveTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { MOCK_UNSUBSCRIBE_KEY } from '@worker/testing/newsletter-send/fixtures';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';

import { loadNewsletterSendContext } from './newsletter-send-context';

vi.mock('@shinefold/db/queries/email-config');
vi.mock('@shinefold/db/queries/site-config');
vi.mock('@shinefold/db/queries/tenant-entitlement-grants');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@worker/utils/env/env');

const MOCK_BRAND_INPUT = {
  preset: PRESET_ID.CONSOLE,
  accentHue: MOCK_ACCENT_HUE,
  logoHue: undefined,
};

describe(loadNewsletterSendContext, () => {
  beforeEach(() => {
    mockEnv.NEWSLETTER_UNSUBSCRIBE_KEY = MOCK_UNSUBSCRIBE_KEY;
    vi.mocked(getSiteConfig).mockResolvedValue({
      ...MOCK_BRAND_INPUT,
      buttonColor: MOCK_YELLOW_HEX,
    } as TSiteConfigResult);
  });

  it.each([
    { plan: TENANT_PLAN.GROWTH, buttonColor: MOCK_YELLOW_HEX },
    { plan: TENANT_PLAN.STARTER, buttonColor: undefined },
    { plan: TENANT_PLAN.FREE, buttonColor: undefined },
  ])(
    "gives a $plan site's brands the button colour its Look allows",
    async ({ plan, buttonColor }) => {
      vi.mocked(getTenantById).mockResolvedValue(mockTenant({ plan }));
      vi.mocked(getTenantEntitlements).mockResolvedValue(
        resolveTenantEntitlements(plan, [], new Date()),
      );

      const { brand, darkBrand } =
        await loadNewsletterSendContext(MOCK_TENANT_ID);

      expect({ brand, darkBrand }).toEqual({
        brand: resolveTenantEmailBrand({ ...MOCK_BRAND_INPUT, buttonColor }),
        darkBrand: resolveTenantEmailDarkBrand({
          ...MOCK_BRAND_INPUT,
          buttonColor,
        }),
      });
    },
  );
});
