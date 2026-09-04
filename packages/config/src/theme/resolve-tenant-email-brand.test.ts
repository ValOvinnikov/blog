import { oklchToHex, wcagContrastRatio } from '@blog/utils/color';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';

import { resolveTenantEmailBrand } from './resolve-tenant-email-brand';

vi.mock('@blog/utils/color', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/utils/color')>()),
  wcagContrastRatio: vi.fn(),
}));

const mockedWcagContrastRatio = vi.mocked(wcagContrastRatio);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/utils/color')>(
      '@blog/utils/color',
    );
  mockedWcagContrastRatio.mockImplementation(actual.wcagContrastRatio);
});

// The light-mode L/C recipe `apps/web/src/utils/build-theme-style-block/
// build-theme-style-block.ts:64-79` emits as `oklch()` CSS for the same
// accent and logo token families — hue is the only value that varies per
// tenant, so reproducing it here (rather than hardcoding expected hex)
// fails if either side's recipe drifts from the other.
const expectedAccentAndLogoHex = (hue: number) => ({
  brandPrimary: oklchToHex(0.53, 0.17, hue),
  brandPrimarySolid: oklchToHex(0.55, 0.17, hue),
  logo1: oklchToHex(0.52, 0.17, hue),
  logo2: oklchToHex(0.63, 0.16, hue),
  logo3: oklchToHex(0.73, 0.13, hue),
});

describe(resolveTenantEmailBrand, () => {
  it('runs the Console preset accentHue through the same recipe as build-theme-style-block', () => {
    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

    const result = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: consoleTokens.accentHue,
    });

    expect(result).toMatchObject(
      expectedAccentAndLogoHex(consoleTokens.accentHue),
    );
  });

  it('resolves accentHue and logoHue independently, each through its own recipe', () => {
    const result = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 65,
      logoHue: 274,
    });

    expect(result.brandPrimary).toBe(oklchToHex(0.53, 0.17, 65));
    expect(result.brandPrimarySolid).toBe(oklchToHex(0.55, 0.17, 65));
    expect(result.logo1).toBe(oklchToHex(0.52, 0.17, 274));
    expect(result.logo2).toBe(oklchToHex(0.63, 0.16, 274));
    expect(result.logo3).toBe(oklchToHex(0.73, 0.13, 274));
  });

  it('falls back to the preset accentHue when the requested hue fails the AA guard', () => {
    mockedWcagContrastRatio.mockReturnValue(1);
    const editorialTokens = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

    const result = resolveTenantEmailBrand({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 310,
    });

    expect(result).toMatchObject(
      expectedAccentAndLogoHex(editorialTokens.accentHue),
    );
  });

  it('returns a flat object of literal hex strings', () => {
    const result = resolveTenantEmailBrand({
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
    });

    for (const value of Object.values(result)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
