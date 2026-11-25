import { hexToOklch, renderedContrastRatio } from '@shinefold/utils/color';

import {
  COLOR_SCHEME,
  CONTRAST_ROLE,
  CONTRAST_ROLE_MIN,
} from '@shinefold/config/constants';

import { deriveButtonColors } from './button-colors';

const CHANNEL_STEPS = ['00', '33', '66', '99', 'cc', 'ff'];

const GREYS = Array.from({ length: 256 }, (_, value) =>
  value.toString(16).padStart(2, '0'),
).map((channel) => `#${channel}${channel}${channel}`);

const SWEEP = [
  ...CHANNEL_STEPS.flatMap((r) =>
    CHANNEL_STEPS.flatMap((g) => CHANNEL_STEPS.map((b) => `#${r}${g}${b}`)),
  ),
  ...GREYS,
];

const WHITE = '#ffffff';
const NEAR_BLACK_MAX_LIGHTNESS = 0.2;
const MOCK_NAVY = '#1a2f6b';
const MOCK_YELLOW = '#ffd400';
const MOCK_DARK_GROUND_PINK = '#ff7ab8';

const contrastOf = (foreground: string, background: string) =>
  renderedContrastRatio(hexToOklch(foreground), [hexToOklch(background)]);

describe(deriveButtonColors, () => {
  it('gives every fill in the sweep a white or near-black label at 4.5:1', () => {
    const failing = SWEEP.flatMap((color) =>
      Object.values(deriveButtonColors({ color })).filter(
        ({ fill, label }) =>
          contrastOf(label, fill) < CONTRAST_ROLE_MIN[CONTRAST_ROLE.TEXT] ||
          (label !== WHITE && hexToOklch(label).l > NEAR_BLACK_MAX_LIGHTNESS),
      ),
    );

    expect(failing).toEqual([]);
  });

  it('labels a bright fill near-black and a deep fill white', () => {
    const bright = deriveButtonColors({ color: MOCK_YELLOW });
    const deep = deriveButtonColors({ color: MOCK_NAVY });

    expect({
      bright:
        hexToOklch(bright[COLOR_SCHEME.LIGHT].label).l <
        NEAR_BLACK_MAX_LIGHTNESS,
      deep: deep[COLOR_SCHEME.LIGHT].label,
    }).toEqual({ bright: true, deep: WHITE });
  });

  it('fills light grounds with the picked colour and shifts the hover off it', () => {
    const { fill, fillHover } = deriveButtonColors({
      color: MOCK_YELLOW.toUpperCase(),
    })[COLOR_SCHEME.LIGHT];

    expect({ fill, hoverDiffers: fillHover !== fill }).toEqual({
      fill: MOCK_YELLOW,
      hoverDiffers: true,
    });
  });

  it('keeps a hover distinct at the lightness extremes', () => {
    const hovers = ['#000000', WHITE].map((color) => {
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
    const colors = deriveButtonColors({ color: MOCK_YELLOW });

    expect(colors[COLOR_SCHEME.DARK]).toEqual(colors[COLOR_SCHEME.LIGHT]);
  });

  it('fills dark grounds with the dark-ground colour when one is given', () => {
    const colors = deriveButtonColors({
      color: MOCK_NAVY,
      darkGroundColor: MOCK_DARK_GROUND_PINK,
    });

    expect({
      light: colors[COLOR_SCHEME.LIGHT].fill,
      dark: colors[COLOR_SCHEME.DARK].fill,
    }).toEqual({ light: MOCK_NAVY, dark: MOCK_DARK_GROUND_PINK });
  });

  it.each(['#fff', 'ffd400', '#ffd40', '#ffd4000', 'yellow', '#ggd400', ''])(
    'rejects %j as the colour',
    (color) => {
      expect(() => deriveButtonColors({ color })).toThrow(color);
    },
  );

  it('rejects a dark-ground colour that is not a 6-digit hex', () => {
    expect(() =>
      deriveButtonColors({ color: MOCK_NAVY, darkGroundColor: 'pink' }),
    ).toThrow('pink');
  });
});
