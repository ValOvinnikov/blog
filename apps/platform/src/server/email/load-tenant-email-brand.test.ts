import {
  MOCK_THEME_FIELDS,
  mockSiteConfig,
} from '@platform/testing/site-config/fixtures';
import {
  resolveTenantEmailBrand,
  resolveTenantEmailDarkBrand,
} from '@shinefold/config';
import { MOCK_YELLOW_HEX } from '@shinefold/config/testing/button-colors';

import { toTenantEmailBrand } from './load-tenant-email-brand';

vi.mock('@shinefold/db', () => ({ queries: {} }));

const { preset, accentHue } = MOCK_THEME_FIELDS;

describe(toTenantEmailBrand, () => {
  it('fills the light and dark email buttons with the saved button colour', () => {
    const { brand, darkBrand } = toTenantEmailBrand(
      mockSiteConfig({ buttonColor: MOCK_YELLOW_HEX }),
    );

    expect([brand.brandPrimarySolid, darkBrand.brandPrimarySolid]).toEqual([
      MOCK_YELLOW_HEX,
      MOCK_YELLOW_HEX,
    ]);
  });

  it('keeps the accent brand when no button colour is saved', () => {
    const { brand, darkBrand } = toTenantEmailBrand(mockSiteConfig());

    expect({ brand, darkBrand }).toEqual({
      brand: resolveTenantEmailBrand({ preset, accentHue }),
      darkBrand: resolveTenantEmailDarkBrand({ preset, accentHue }),
    });
  });
});
