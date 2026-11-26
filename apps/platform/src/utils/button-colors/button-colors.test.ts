import { COLOR_SCHEME, deriveButtonColors, PRESET_ID } from '@shinefold/config';
import {
  MOCK_PARTIAL_HEX,
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';

import {
  isButtonColorInvalid,
  toButtonColors,
  withPresetButtonColor,
} from './button-colors';

describe(toButtonColors, () => {
  it('derives no colours while the button follows the accent', () => {
    expect(toButtonColors({})).toBeUndefined();
  });

  it('uses the dark-ground colour on dark grounds when one is picked', () => {
    const colors = toButtonColors({
      buttonColor: MOCK_YELLOW_HEX,
      buttonColorDark: MOCK_PINK_HEX,
    });

    expect(colors?.[COLOR_SCHEME.DARK].fill).toBe(MOCK_PINK_HEX);
  });

  it('derives the dark-ground colour while the picked one is not a hex colour yet', () => {
    expect(
      toButtonColors({
        buttonColor: MOCK_YELLOW_HEX,
        buttonColorDark: MOCK_PARTIAL_HEX,
      }),
    ).toEqual(deriveButtonColors({ color: MOCK_YELLOW_HEX }));
  });
});

describe(isButtonColorInvalid, () => {
  it.each([
    ['no colour', undefined, false],
    ['a hex colour', MOCK_YELLOW_HEX, false],
    ['a partly typed hex colour', MOCK_PARTIAL_HEX, true],
    ['an emptied field', '', true],
  ])('reports %s as invalid: %s', (_, value, isInvalid) => {
    expect(isButtonColorInvalid(value)).toBe(isInvalid);
  });
});

describe(withPresetButtonColor, () => {
  it("takes the preset's colour while none is saved", () => {
    expect(
      withPresetButtonColor({ preset: PRESET_ID.SHINEFOLD }).buttonColor,
    ).toBe(SHINEFOLD_LOGO_COLOR.YELLOW);
  });

  it('keeps a saved colour over the preset’s', () => {
    expect(
      withPresetButtonColor({
        preset: PRESET_ID.SHINEFOLD,
        buttonColor: MOCK_PINK_HEX,
      }).buttonColor,
    ).toBe(MOCK_PINK_HEX);
  });

  it('leaves the colour unset under a preset without one', () => {
    expect(
      withPresetButtonColor({ preset: PRESET_ID.CONSOLE }).buttonColor,
    ).toBeUndefined();
  });
});
