import { renderedContrastRatio } from '@blog/utils/color';

import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';

import { isAccentHueAccessible } from './accent-hue-guard';

vi.mock(import('@blog/utils/color'), async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    renderedContrastRatio: vi.fn(actual.renderedContrastRatio),
  };
});

const MOCK_ACCENT_HUE = 310;

beforeEach(() => {
  vi.mocked(renderedContrastRatio).mockReset();
});

describe(isAccentHueAccessible, () => {
  it.each([PRESET_ID.CONSOLE, PRESET_ID.EDITORIAL])(
    'accepts the %s preset accent hue',
    (preset) => {
      const { accentHue } = PRESET_REGISTRY[preset].themeTokens;

      expect(isAccentHueAccessible(accentHue)).toBe(true);
    },
  );

  it('rejects a hue whose rendered contrast falls below the AA floor', () => {
    vi.mocked(renderedContrastRatio).mockReturnValue(1);

    expect(isAccentHueAccessible(MOCK_ACCENT_HUE)).toBe(false);
  });
});
