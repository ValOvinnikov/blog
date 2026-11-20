import {
  hexToOklch,
  oklchToHex,
  renderedContrastRatio,
  WCAG_AA_CONTRAST_MIN,
} from '@shinefold/utils/color';

import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config/constants';

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

vi.mock(import('@shinefold/utils/color'), async (importOriginal) => {
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

const LIGHT_RAMPS = { accent: ACCENT_RAMP_LIGHT, logo: LOGO_RAMP_LIGHT };
const DARK_RAMPS = { accent: ACCENT_RAMP_DARK, logo: LOGO_RAMP_DARK };

const expectedAccentAndLogoHex = (
  { accent, logo }: typeof LIGHT_RAMPS | typeof DARK_RAMPS,
  accentHue: number,
  logoHue = accentHue,
) => ({
  brandPrimary: hexAt(accent['--brand-primary'], accentHue),
  brandPrimarySolid: hexAt(accent['--brand-primary-solid'], accentHue),
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
  it('resolves the accent and logo colours from an accessible accent hue', () => {
    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } = resolve({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
    });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(ramps, MOCK_ACCENT_HUE),
    );
  });

  it('resolves the accent and logo hues independently', () => {
    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } = resolve({
      preset: PRESET_ID.CONSOLE,
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
    });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(ramps, MOCK_ACCENT_HUE, MOCK_LOGO_HUE),
    );
  });

  it('falls back to the preset accent hue when the requested one fails AA', () => {
    failAccentHueGuard();
    const { accentHue } = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const { brandPrimary, brandPrimarySolid, logo1, logo2, logo3 } = resolve({
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
    });

    expect({ brandPrimary, brandPrimarySolid, logo1, logo2, logo3 }).toEqual(
      expectedAccentAndLogoHex(ramps, accentHue),
    );
  });
});

describe(resolveTenantEmailBrand, () => {
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

describe(resolveTenantEmailDarkBrand, () => {
  it.each(
    Object.values(PRESET_ID).flatMap((preset) => [
      { preset, guard: 'passes', isGuardFailing: false },
      { preset, guard: 'fails', isGuardFailing: true },
    ]),
  )(
    'keeps AA contrast on $preset when the accent-hue guard $guard',
    ({ preset, isGuardFailing }) => {
      if (isGuardFailing) failAccentHueGuard();

      const {
        surface,
        text,
        textMuted,
        brandPrimarySolid,
        brandPrimaryContrast,
      } = resolveTenantEmailDarkBrand({ preset, accentHue: MOCK_ACCENT_HUE });

      const ratios = {
        text: contrastOf(text, surface),
        textMuted: contrastOf(textMuted, surface),
        accent: contrastOf(brandPrimaryContrast, brandPrimarySolid),
      };
      const failing = Object.entries(ratios).filter(
        ([, ratio]) => !(ratio >= WCAG_AA_CONTRAST_MIN),
      );

      expect(failing).toEqual([]);
    },
  );
});
