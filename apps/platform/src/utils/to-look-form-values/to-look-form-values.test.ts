import { faker } from '@faker-js/faker';
import {
  MOCK_FAVICON_URL,
  MOCK_LOGO_URL,
  mockSiteConfig,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import {
  lookFormValuesOrDefaults,
  toLookFormValues,
} from './to-look-form-values';

faker.seed(6006);

const MOCK_BRAND_NAME = faker.company.name();

const MOCK_SITE_CONFIG = mockSiteConfig({
  logoHue: faker.number.int({ min: 0, max: 360 }),
  brandName: MOCK_BRAND_NAME,
  logoAssetUrl: MOCK_LOGO_URL,
  faviconAssetUrl: MOCK_FAVICON_URL,
});

describe(toLookFormValues, () => {
  it('carries every stored column through unchanged', () => {
    const values = toLookFormValues(MOCK_SITE_CONFIG);

    expect(values).toEqual({
      preset: MOCK_SITE_CONFIG.preset,
      accentHue: MOCK_SITE_CONFIG.accentHue,
      logoHue: MOCK_SITE_CONFIG.logoHue,
      headingFont: MOCK_SITE_CONFIG.headingFont,
      bodyFont: MOCK_SITE_CONFIG.bodyFont,
      radiusScale: MOCK_SITE_CONFIG.radiusScale,
      density: MOCK_SITE_CONFIG.density,
      languageSwitcherStyle: MOCK_SITE_CONFIG.languageSwitcherStyle,
      cardStyle: MOCK_SITE_CONFIG.cardStyle,
      headerControlStyle: MOCK_SITE_CONFIG.headerControlStyle,
      headerControlShape: MOCK_SITE_CONFIG.headerControlShape,
      headerLayout: MOCK_SITE_CONFIG.headerLayout,
      headerSubmenuStyle: MOCK_SITE_CONFIG.headerSubmenuStyle,
      headerBarStyle: MOCK_SITE_CONFIG.headerBarStyle,
      navLinkStyle: MOCK_SITE_CONFIG.navLinkStyle,
      accountButtonStyle: MOCK_SITE_CONFIG.accountButtonStyle,
      accountPanelStyle: MOCK_SITE_CONFIG.accountPanelStyle,
      accountPhonePlacement: MOCK_SITE_CONFIG.accountPhonePlacement,
      busyButtonStyle: MOCK_SITE_CONFIG.busyButtonStyle,
      spinnerStyle: MOCK_SITE_CONFIG.spinnerStyle,
      buttonShape: MOCK_SITE_CONFIG.buttonShape,
      footerLayout: MOCK_SITE_CONFIG.footerLayout,
      footerBackground: MOCK_SITE_CONFIG.footerBackground,
      footerSurface: MOCK_SITE_CONFIG.footerSurface,
      cookieSettingsButton: MOCK_SITE_CONFIG.cookieSettingsButton,
      brandName: MOCK_BRAND_NAME,
      logo: { url: MOCK_LOGO_URL },
      favicon: { url: MOCK_FAVICON_URL },
    });
  });

  it('reads an unset brand name as a blank field', () => {
    const values = toLookFormValues({
      ...MOCK_SITE_CONFIG,
      brandName: undefined,
    });

    expect(values.brandName).toBe('');
  });
});

describe(lookFormValuesOrDefaults, () => {
  it('falls back to the defaults when there is no saved row', () => {
    const values = lookFormValuesOrDefaults(undefined);

    expect(values).toEqual(defaultLookFormValues());
  });

  it('reads the saved row when there is one', () => {
    const values = lookFormValuesOrDefaults(MOCK_SITE_CONFIG);

    expect(values).toEqual(toLookFormValues(MOCK_SITE_CONFIG));
  });
});
