import { renderedContrastRatio } from '@shinefold/utils/color';

import {
  findFailingAccentPairs,
  isAccentHueAccessible,
} from './accent-hue-guard';
import { ALL_HUES } from './contrast-check';
import type { TContrastPairId } from './contrast-pairs';

vi.mock(import('@shinefold/utils/color'), async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    renderedContrastRatio: vi.fn(actual.renderedContrastRatio),
  };
});

const MOCK_ACCENT_HUE = 310;

const ACCENT_PAIR: TContrastPairId = 'BRAND_PRIMARY_CONTRAST';
const FIXED_PAIR: TContrastPairId = 'BORDER_STRONG';

beforeEach(() => {
  vi.mocked(renderedContrastRatio).mockReset();
});

describe(findFailingAccentPairs, () => {
  describe('when every pair falls below its floor', () => {
    beforeEach(() => {
      vi.mocked(renderedContrastRatio).mockReturnValue(1);
    });

    it('names each failing accent-moving pair once', () => {
      const failing = findFailingAccentPairs(MOCK_ACCENT_HUE);

      expect(failing).toContain(ACCENT_PAIR);
      expect(new Set(failing).size).toBe(failing.length);
    });

    it('leaves out pairs the accent hue cannot move', () => {
      expect(findFailingAccentPairs(MOCK_ACCENT_HUE)).not.toContain(FIXED_PAIR);
    });
  });
});

describe(isAccentHueAccessible, () => {
  it('accepts every hue', () => {
    expect(ALL_HUES.every(isAccentHueAccessible)).toBe(true);
  });

  it('rejects a hue that is not a number', () => {
    expect(isAccentHueAccessible(Number.NaN)).toBe(false);
  });

  it('rejects a hue at which an accent-moving pair fails', () => {
    vi.mocked(renderedContrastRatio).mockReturnValue(1);

    expect(isAccentHueAccessible(MOCK_ACCENT_HUE)).toBe(false);
  });
});
