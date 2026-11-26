import { COLOR_SCHEME, deriveButtonColors } from '@shinefold/config';
import {
  MOCK_PARTIAL_HEX,
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';

import { isButtonColorInvalid, toButtonColors } from './button-colors';

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
