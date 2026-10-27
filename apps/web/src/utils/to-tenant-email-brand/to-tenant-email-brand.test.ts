import {
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
} from '@blog/config';
import { faker } from '@faker-js/faker';

import { toTenantEmailBrand } from './to-tenant-email-brand';

faker.seed(6012);

const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 150 });
const MOCK_OTHER_ACCENT_HUE = faker.number.int({ min: 200, max: 360 });
const MOCK_LOGO_HUE = faker.number.int({ min: 0, max: 360 });

describe(toTenantEmailBrand, () => {
  it('falls back to the Console preset defaults when there is no row', () => {
    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

    const result = toTenantEmailBrand(undefined);

    expect(result).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: consoleTokens.accentHue,
        logoHue: consoleTokens.logoHue,
      }),
    );
  });

  it("resolves the given row's preset and hues", () => {
    const result = toTenantEmailBrand({
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
    });

    expect(result).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_ACCENT_HUE,
        logoHue: MOCK_LOGO_HUE,
      }),
    );
  });

  it("falls back to the preset's logo hue when the row omits it", () => {
    const editorialTokens = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const result = toTenantEmailBrand({
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
    });

    expect(result).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_ACCENT_HUE,
        logoHue: editorialTokens.logoHue,
      }),
    );
  });

  it('produces a different brand colour for a different accent hue', () => {
    const first = toTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
    });
    const second = toTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_OTHER_ACCENT_HUE,
    });

    expect(first.brandPrimary).not.toBe(second.brandPrimary);
  });
});
