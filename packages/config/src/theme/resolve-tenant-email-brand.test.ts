import { oklchToHex, renderedContrastRatio } from '@blog/utils/color';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';

import { resolveTenantEmailBrand } from './resolve-tenant-email-brand';
import {
  ACCENT_RAMP_LIGHT,
  LOGO_RAMP_LIGHT,
  type TOklchStop,
} from './theme-declarations';

vi.mock(import('@blog/utils/color'), async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    renderedContrastRatio: vi.fn(actual.renderedContrastRatio),
  };
});

const MOCK_ACCENT_HUE = 65;
const MOCK_LOGO_HUE = 274;
const HEX_COLOR = /^#[0-9a-f]{6}$/;

const hexAt = ({ l, c }: TOklchStop, hue: number) => oklchToHex(l, c, hue);

const expectedAccentAndLogoHex = (accentHue: number, logoHue = accentHue) => ({
  brandPrimary: hexAt(ACCENT_RAMP_LIGHT['--brand-primary'], accentHue),
  brandPrimarySolid: hexAt(
    ACCENT_RAMP_LIGHT['--brand-primary-solid'],
    accentHue,
  ),
  logo1: hexAt(LOGO_RAMP_LIGHT['--logo-1'], logoHue),
  logo2: hexAt(LOGO_RAMP_LIGHT['--logo-2'], logoHue),
  logo3: hexAt(LOGO_RAMP_LIGHT['--logo-3'], logoHue),
});

beforeEach(() => {
  vi.mocked(renderedContrastRatio).mockReset();
});

describe(resolveTenantEmailBrand, () => {
  it('resolves the accent and logo colours from an accessible accent hue', () => {
    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } =
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
      });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(MOCK_ACCENT_HUE),
    );
  });

  it('resolves the accent and logo hues independently', () => {
    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } =
      resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: MOCK_ACCENT_HUE,
        logoHue: MOCK_LOGO_HUE,
      });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(MOCK_ACCENT_HUE, MOCK_LOGO_HUE),
    );
  });

  it('falls back to the preset accent hue when the requested one fails AA', () => {
    vi.mocked(renderedContrastRatio).mockReturnValue(1);
    const { accentHue } = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } =
      resolveTenantEmailBrand({
        preset: PRESET_ID.EDITORIAL,
        accentHue: MOCK_ACCENT_HUE,
      });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(accentHue),
    );
  });

  it('returns a flat object of literal hex strings', () => {
    const brand = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
    });

    const nonHex = Object.values(brand).filter(
      (value) => !HEX_COLOR.test(value),
    );

    expect(nonHex).toEqual([]);
  });
});
