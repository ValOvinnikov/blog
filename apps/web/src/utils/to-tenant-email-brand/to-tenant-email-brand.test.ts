import {
  PRESET_ID,
  PRESET_REGISTRY,
  resolveTenantEmailBrand,
} from '@blog/config';

import { toTenantEmailBrand } from './to-tenant-email-brand';

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

  it('resolves the given row through the same recipe as resolveTenantEmailBrand', () => {
    const result = toTenantEmailBrand({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 190,
      logoHue: 40,
    });

    expect(result).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.EDITORIAL,
        accentHue: 190,
        logoHue: 40,
      }),
    );
  });

  it('falls back to the preset accentHue when the row omits logoHue', () => {
    const editorialTokens = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const result = toTenantEmailBrand({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 190,
    });

    expect(result).toEqual(
      resolveTenantEmailBrand({
        preset: PRESET_ID.EDITORIAL,
        accentHue: 190,
        logoHue: editorialTokens.logoHue,
      }),
    );
  });

  it('produces a different hex output for a different accent hue', () => {
    const blue = toTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 220,
    });
    const orange = toTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 30,
    });

    expect(blue.brandPrimary).not.toBe(orange.brandPrimary);
  });
});
