import {
  MOCK_BLACK_HEX,
  MOCK_PINK_HEX,
  MOCK_WHITE_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import { hexToOklch, renderedContrastRatio } from '@shinefold/utils/color';

import {
  COLOR_SCHEME,
  CONTRAST_ROLE,
  CONTRAST_ROLE_MIN,
} from '@shinefold/config/constants';

import { deriveButtonColors } from './button-colors';

const MOCK_CHANNEL_STEPS = ['00', '33', '66', '99', 'cc', 'ff'];

const MOCK_GREYS = Array.from({ length: 256 }, (_, value) =>
  value.toString(16).padStart(2, '0'),
).map((channel) => `#${channel}${channel}${channel}`);

const MOCK_SWEEP = [
  ...MOCK_CHANNEL_STEPS.flatMap((r) =>
    MOCK_CHANNEL_STEPS.flatMap((g) =>
      MOCK_CHANNEL_STEPS.map((b) => `#${r}${g}${b}`),
    ),
  ),
  ...MOCK_GREYS,
];

const MOCK_NEAR_BLACK_MAX_LIGHTNESS = 0.2;
const MOCK_NAVY = '#1a2f6b';

const contrastOf = (foreground: string, background: string) =>
  renderedContrastRatio(hexToOklch(foreground), [hexToOklch(background)]);

describe(deriveButtonColors, () => {
  it('gives every fill in the sweep a white or near-black label at 4.5:1', () => {
    const failing = MOCK_SWEEP.flatMap((color) =>
      Object.values(deriveButtonColors({ color })).filter(
        ({ fill, label }) =>
          contrastOf(label, fill) < CONTRAST_ROLE_MIN[CONTRAST_ROLE.TEXT] ||
          (label !== MOCK_WHITE_HEX &&
            hexToOklch(label).l > MOCK_NEAR_BLACK_MAX_LIGHTNESS),
      ),
    );

    expect(failing).toEqual([]);
  });

  it('labels a bright fill near-black and a deep fill white', () => {
    const bright = deriveButtonColors({ color: MOCK_YELLOW_HEX });
    const deep = deriveButtonColors({ color: MOCK_NAVY });

    expect({
      bright:
        hexToOklch(bright[COLOR_SCHEME.LIGHT].label).l <
        MOCK_NEAR_BLACK_MAX_LIGHTNESS,
      deep: deep[COLOR_SCHEME.LIGHT].label,
    }).toEqual({ bright: true, deep: MOCK_WHITE_HEX });
  });

  it('fills light grounds with the picked colour and shifts the hover off it', () => {
    const { fill, fillHover } = deriveButtonColors({
      color: MOCK_YELLOW_HEX.toUpperCase(),
    })[COLOR_SCHEME.LIGHT];

    expect({ fill, hoverDiffers: fillHover !== fill }).toEqual({
      fill: MOCK_YELLOW_HEX,
      hoverDiffers: true,
    });
  });

  it('keeps a hover distinct at the lightness extremes', () => {
    const hovers = [MOCK_BLACK_HEX, MOCK_WHITE_HEX].map((color) => {
      const { fill, fillHover } = deriveButtonColors({ color })[
        COLOR_SCHEME.LIGHT
      ];
      return fillHover !== fill;
    });

    expect(hovers).toEqual([true, true]);
  });

  it('derives a lighter dark-ground fill from a deep colour when none is given', () => {
    const colors = deriveButtonColors({ color: MOCK_NAVY });
    const light = hexToOklch(colors[COLOR_SCHEME.LIGHT].fill);
    const dark = hexToOklch(colors[COLOR_SCHEME.DARK].fill);

    expect({
      lighter: dark.l > light.l,
      hueKept: Math.abs(dark.h - light.h) < 1,
    }).toEqual({ lighter: true, hueKept: true });
  });

  it('keeps a bright colour as its own dark-ground fill when none is given', () => {
    const colors = deriveButtonColors({ color: MOCK_YELLOW_HEX });

    expect(colors[COLOR_SCHEME.DARK]).toEqual(colors[COLOR_SCHEME.LIGHT]);
  });

  it('fills dark grounds with the dark-ground colour when one is given', () => {
    const colors = deriveButtonColors({
      color: MOCK_NAVY,
      darkGroundColor: MOCK_PINK_HEX,
    });

    expect({
      light: colors[COLOR_SCHEME.LIGHT].fill,
      dark: colors[COLOR_SCHEME.DARK].fill,
    }).toEqual({ light: MOCK_NAVY, dark: MOCK_PINK_HEX });
  });

  it.each([
    ['colour', { color: 'yellow' }],
    ['dark-ground colour', { color: MOCK_NAVY, darkGroundColor: 'pink' }],
  ])('rejects a %s that is not a 6-digit hex', (_field, input) => {
    expect(() => deriveButtonColors(input)).toThrow();
  });

  it('treats an empty dark-ground colour as unset', () => {
    expect(
      deriveButtonColors({ color: MOCK_NAVY, darkGroundColor: '' }),
    ).toEqual(deriveButtonColors({ color: MOCK_NAVY }));
  });
});
