import {
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';
import { makeRawThemeSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeTenant } from '@blog/service/testing/tenant';

import { getTheme } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/config')>()),
  isAccentHueAccessible: vi.fn(),
}));

const mockedIsAccentHueAccessible = vi.mocked(isAccentHueAccessible);
const tenant = makeTenant();
const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/config')>('@blog/config');
  mockedIsAccentHueAccessible.mockImplementation(actual.isAccentHueAccessible);
});

describe('getTheme', () => {
  it('falls back to the console preset when no settings_theme document exists', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getTheme(tenant);

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

    const result = await getTheme(tenant);

    expect(result).toEqual({ ...editorial, logoHue: editorial.accentHue });
  });

  it('layers a single accentHue override on top of the editorial preset', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL, accentHue: 200 }),
    );

    const result = await getTheme(tenant);

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

    const result = await getTheme(tenant);

    expect(result.accentHue).toBe(65);
    expect(result.logoHue).toBe(274);
  });

  it('falls back to the preset accentHue when a tenant override fails the AA guard', async () => {
    mockedIsAccentHueAccessible.mockReturnValue(false);
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL, accentHue: 310 }),
    );

    const result = await getTheme(tenant);

    expect(result.accentHue).toBe(editorial.accentHue);
    expect(result.logoHue).toBe(editorial.accentHue);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    mockRun.mockResolvedValue(makeRawThemeSettings());

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
});
