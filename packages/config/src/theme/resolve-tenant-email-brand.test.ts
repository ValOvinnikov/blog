import {
  hexToOklch,
  isHexColor,
  oklchToHex,
  renderedContrastRatio,
  WCAG_AA_CONTRAST_MIN,
} from '@shinefold/utils/color';

import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config/constants';
import { MOCK_YELLOW_HEX } from '@shinefold/config/testing/button-colors';

import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  LOGO_RAMP_DARK,
  LOGO_RAMP_LIGHT,
} from './accent-ramps';
import {
  resolveTenantEmailBrand,
  resolveTenantEmailDarkBrand,
} from './resolve-tenant-email-brand';
import type { TOklchStop } from './theme-declarations';
import { NEUTRAL_RAMP_DARK, NEUTRAL_RAMP_LIGHT } from './theme-ramps';

vi.mock(import('@shinefold/utils/color'), async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    renderedContrastRatio: vi.fn(actual.renderedContrastRatio),
  };
});

const MOCK_ACCENT_HUE = 65;
const MOCK_LOGO_HUE = 274;

const hexAt = ({ l, c, h }: TOklchStop, hue: number) =>
  oklchToHex(l, c, h ?? hue);

const LIGHT_RAMPS = {
  neutral: NEUTRAL_RAMP_LIGHT,
  accent: ACCENT_RAMP_LIGHT,
  logo: LOGO_RAMP_LIGHT,
};
const DARK_RAMPS = {
  neutral: NEUTRAL_RAMP_DARK,
  accent: ACCENT_RAMP_DARK,
  logo: LOGO_RAMP_DARK,
};

const expectedBrandHex = (
  { neutral, accent, logo }: typeof LIGHT_RAMPS | typeof DARK_RAMPS,
  accentHue: number,
  logoHue = accentHue,
) => ({
  surface: hexAt(neutral['--surface'], accentHue),
  surface2: hexAt(neutral['--surface-2'], accentHue),
  border: hexAt(neutral['--border'], accentHue),
  text: hexAt(neutral['--text'], accentHue),
  textMuted: hexAt(neutral['--text-muted'], accentHue),
  brandPrimary: hexAt(accent['--brand-primary'], accentHue),
  brandPrimarySolid: hexAt(accent['--brand-primary-solid'], accentHue),
  brandPrimaryContrast: hexAt(accent['--brand-primary-contrast'], accentHue),
  logo1: hexAt(logo['--logo-1'], logoHue),
  logo2: hexAt(logo['--logo-2'], logoHue),
  logo3: hexAt(logo['--logo-3'], logoHue),
});

const contrastOf = (foreground: string, background: string) =>
  renderedContrastRatio(hexToOklch(foreground), [hexToOklch(background)]);

const failAccentHueGuard = () =>
  vi
    .mocked(renderedContrastRatio)
    .mockReturnValueOnce(1)
    .mockReturnValueOnce(1);

const MODES = [
  { mode: 'light', resolve: resolveTenantEmailBrand, ramps: LIGHT_RAMPS },
  { mode: 'dark', resolve: resolveTenantEmailDarkBrand, ramps: DARK_RAMPS },
];

beforeEach(() => {
  vi.mocked(renderedContrastRatio).mockReset();
});

describe.each(MODES)('the $mode email brand', ({ resolve, ramps }) => {
  it('resolves every colour to literal hex from an accessible accent hue', () => {
    const brand = resolve({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
    });
    const nonHex = Object.values(brand).filter((value) => !isHexColor(value));

    expect({ brand, nonHex }).toEqual({
      brand: expectedBrandHex(ramps, MOCK_ACCENT_HUE),
      nonHex: [],
    });
  });

  it('resolves the accent and logo hues independently', () => {
    const brand = resolve({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
    });

    expect(brand).toEqual(
      expectedBrandHex(ramps, MOCK_ACCENT_HUE, MOCK_LOGO_HUE),
    );
  });

  it('takes the light-ground button colour for its button fill and label', () => {
    const brand = resolve({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
      buttonColor: MOCK_YELLOW_HEX,
    });

    expect({
      brand,
      labelContrast:
        contrastOf(brand.brandPrimaryContrast, brand.brandPrimarySolid) >=
        WCAG_AA_CONTRAST_MIN,
    }).toEqual({
      brand: {
        ...expectedBrandHex(ramps, MOCK_ACCENT_HUE),
        brandPrimarySolid: MOCK_YELLOW_HEX,
        brandPrimaryContrast: expect.any(String),
      },
      labelContrast: true,
    });
  });

  it('falls back to the preset accent hue when the requested one fails AA', () => {
    failAccentHueGuard();
    const { accentHue } = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const brand = resolve({
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
    });

    expect(brand).toEqual(expectedBrandHex(ramps, accentHue));
  });
});

describe(resolveTenantEmailDarkBrand, () => {
  it('keeps AA contrast for text, muted text and the accent', () => {
    const {
      surface,
      text,
      textMuted,
      brandPrimarySolid,
      brandPrimaryContrast,
    } = resolveTenantEmailDarkBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
    });

    const ratios = {
      text: contrastOf(text, surface),
      textMuted: contrastOf(textMuted, surface),
      accent: contrastOf(brandPrimaryContrast, brandPrimarySolid),
    };
    const failing = Object.entries(ratios).filter(
      ([, ratio]) => !(ratio >= WCAG_AA_CONTRAST_MIN),
    );

    expect(failing).toEqual([]);
  });
});
