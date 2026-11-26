import {
  PRESET_ID,
  PRESET_REGISTRY,
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

const MOCK_LOGO_HUE = 140;
const { headingFont: STORED_HEADING_FONT, bodyFont: STORED_BODY_FONT } =
  PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
const { headingFont: PRESET_HEADING_FONT, bodyFont: PRESET_BODY_FONT } =
  PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

const MOCK_STORED_LOOK = {
  preset: PRESET_ID.CONSOLE,
  accentHue: MOCK_ACCENT_HUE,
  logoHue: MOCK_LOGO_HUE,
  buttonColor: MOCK_YELLOW_HEX,
  headingFont: STORED_HEADING_FONT,
  bodyFont: STORED_BODY_FONT,
};

const MOCK_PRESET_LOOK = {
  ...MOCK_STORED_LOOK,
  logoHue: undefined,
  buttonColor: undefined,
  headingFont: PRESET_HEADING_FONT,
  bodyFont: PRESET_BODY_FONT,
};

describe(loadNewsletterSendContext, () => {
  beforeEach(() => {
    mockEnv.NEWSLETTER_UNSUBSCRIBE_KEY = MOCK_UNSUBSCRIBE_KEY;
    vi.mocked(getSiteConfig).mockResolvedValue(
      MOCK_STORED_LOOK as TSiteConfigResult,
    );
  });

  it.each([
    { plan: TENANT_PLAN.GROWTH, look: MOCK_STORED_LOOK },
    { plan: TENANT_PLAN.STARTER, look: MOCK_PRESET_LOOK },
    { plan: TENANT_PLAN.FREE, look: MOCK_PRESET_LOOK },
  ])(
    "styles a $plan site's email with the Look its plan allows",
    async ({ plan, look }) => {
      vi.mocked(getTenantById).mockResolvedValue(mockTenant({ plan }));
      vi.mocked(getTenantEntitlements).mockResolvedValue(
        resolveTenantEntitlements(plan, [], new Date()),
      );

      const { brand, darkBrand, headingFont, bodyFont } =
        await loadNewsletterSendContext(MOCK_TENANT_ID);

      expect({ brand, darkBrand, headingFont, bodyFont }).toEqual({
        brand: resolveTenantEmailBrand(look),
        darkBrand: resolveTenantEmailDarkBrand(look),
        headingFont: look.headingFont,
        bodyFont: look.bodyFont,
      });
    },
  );
});
