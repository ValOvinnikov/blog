import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { makeRawThemeSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { wcagContrastRatio } from '@blog/utils';

import { getTheme } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

// The real contrast math is covered by @blog/utils's own oklch.test.ts;
// mocked here so one test below can force the resolver's AA-fallback branch
// (a full 0–360 scan at 0.05° resolution found no real accentHue that fails
// this fixed-L/C pairing — see that test for why it's simulated, not real).
vi.mock('@blog/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/utils')>()),
  wcagContrastRatio: vi.fn(),
}));

const mockedWcagContrastRatio = vi.mocked(wcagContrastRatio);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/utils')>('@blog/utils');
  mockedWcagContrastRatio.mockImplementation(actual.wcagContrastRatio);
});

describe('getTheme', () => {
  it('falls back to the console preset when no settings_theme document exists', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getTheme();

    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
    expect(result).toEqual({
      ...consoleTokens,
      logoHue: consoleTokens.accentHue,
    });
  });

  it('returns the editorial preset unchanged when the document sets no overrides', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL }),
    );

    const result = await getTheme();

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result).toEqual({ ...editorial, logoHue: editorial.accentHue });
  });

  it('layers a single accentHue override on top of the editorial preset', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL, accentHue: 200 }),
    );

    const result = await getTheme();

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result).toEqual({
      ...editorial,
      accentHue: 200,
      logoHue: 200,
    });
  });

  it('resolves accentHue and logoHue independently (Indigo reproduction)', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({
        preset: PRESET_ID.CONSOLE,
        accentHue: 65,
        logoHue: 274,
      }),
    );

    const result = await getTheme();

    expect(result.accentHue).toBe(65);
    expect(result.logoHue).toBe(274);
  });

  it('falls back to the preset accentHue when a tenant override fails the AA guard', async () => {
    mockedWcagContrastRatio.mockReturnValue(1);
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL, accentHue: 310 }),
    );

    const result = await getTheme();

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result.accentHue).toBe(editorial.accentHue);
    expect(result.logoHue).toBe(editorial.accentHue);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawThemeSettings());
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    await getTheme(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:theme-settings'],
        }),
      }),
    );
  });

  it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
    mockRun.mockResolvedValue(makeRawThemeSettings());

    await getTheme();

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant: undefined,
        next: expect.objectContaining({ tags: ['theme-settings'] }),
      }),
    );
  });
});
