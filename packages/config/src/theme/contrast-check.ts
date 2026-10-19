import {
  CARD_STYLE,
  COLOR_SCHEME,
  CONTRAST_ROLE_MIN,
  HEADER_CONTROL_STYLE,
  HUE_MAX,
  HUE_MIN,
  type TCardStyle,
  type TColorScheme,
  type THeaderControlStyle,
} from '@blog/config/constants';

import {
  CONTRAST_PAIRS,
  type TContrastPairId,
  type TThemeToken,
} from './contrast-pairs';
import { measureContrast, tokenFollowsAccentHue } from './contrast-tokens';
import {
  CARD_STYLE_DECLARATIONS,
  HEADER_CONTROL_STYLE_DECLARATIONS,
} from './theme-declarations';

export type TContrastFailure = {
  pair: TContrastPairId;
  surface: TThemeToken;
  scheme: TColorScheme;
  cardStyle?: TCardStyle;
  headerControlStyle?: THeaderControlStyle;
  hues: string;
};

const ALL_HUES = Array.from({ length: HUE_MAX - HUE_MIN }, (_, i) => i);
const CARD_STYLE_TOKENS = new Set(
  Object.values(CARD_STYLE).flatMap((style) =>
    Object.keys(CARD_STYLE_DECLARATIONS[style]),
  ),
);
const HEADER_CONTROL_STYLE_TOKENS = new Set(
  Object.values(HEADER_CONTROL_STYLE).flatMap((style) =>
    Object.keys(HEADER_CONTROL_STYLE_DECLARATIONS[style]),
  ),
);

const formatHueRanges = (hues: readonly number[]): string =>
  hues
    .reduce<[number, number][]>((ranges, hue) => {
      const last = ranges.at(-1);
      if (last && hue === last[1] + 1) last[1] = hue;
      else ranges.push([hue, hue]);
      return ranges;
    }, [])
    .map(([from, to]) => (from === to ? `${from}` : `${from}-${to}`))
    .join(', ');

export const findContrastFailures = (): TContrastFailure[] =>
  Object.entries(CONTRAST_PAIRS).flatMap(([id, pair]) => {
    const { foreground, surfaces, role, followsAccentHue } = pair;
    const tokens = [foreground, ...surfaces];
    const varies = tokens.some((token) => CARD_STYLE_TOKENS.has(token));
    const variesByHeader = tokens.some((token) =>
      HEADER_CONTROL_STYLE_TOKENS.has(token),
    );
    const cardStyles = varies
      ? Object.values(CARD_STYLE)
      : [CARD_STYLE.ACCENT_BAR];
    const headerControlStyles = variesByHeader
      ? Object.values(HEADER_CONTROL_STYLE)
      : [HEADER_CONTROL_STYLE.OUTLINED];
    const styleContexts = cardStyles.flatMap((cardStyle) =>
      headerControlStyles.map((headerControlStyle) => ({
        cardStyle,
        headerControlStyle,
      })),
    );

    return Object.values(COLOR_SCHEME).flatMap((scheme) =>
      styleContexts.flatMap((styles) => {
        const { cardStyle, headerControlStyle } = styles;
        const context = { scheme, ...styles };
        const resolvedFollowsHue = tokens.some((token) =>
          tokenFollowsAccentHue(token, context),
        );
        if (resolvedFollowsHue && !followsAccentHue) {
          throw new Error(`${id} moves with the accent hue under ${scheme}`);
        }

        return surfaces.flatMap((surface) => {
          const failingHues = (followsAccentHue ? ALL_HUES : [0]).filter(
            (hue) =>
              measureContrast(foreground, surface, { ...context, hue }) <
              CONTRAST_ROLE_MIN[role],
          );
          if (failingHues.length === 0) return [];

          return {
            pair: id as TContrastPairId,
            surface,
            scheme,
            ...(varies && { cardStyle }),
            ...(variesByHeader && { headerControlStyle }),
            hues: formatHueRanges(followsAccentHue ? failingHues : ALL_HUES),
          };
        });
      }),
    );
  });
