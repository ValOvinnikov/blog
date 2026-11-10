import { hasLength } from '@blog/utils/primitives';

import {
  COLOR_SCHEME,
  CONTRAST_ROLE_MIN,
  HUE_MAX,
  HUE_MIN,
  type TCardStyle,
  type TColorScheme,
  type THeaderControlStyle,
  type TNavLinkStyle,
} from '@blog/config/constants';

import {
  CONTRAST_PAIRS,
  type TContrastPairId,
  type TThemeToken,
} from './contrast-pairs';
import { findVaryingAxes, styleContextsFor } from './contrast-style-axes';
import {
  isTransparentToken,
  measureContrast,
  tokenFollowsAccentHue,
} from './contrast-tokens';

export type TContrastFailure = {
  pair: TContrastPairId;
  surface: TThemeToken;
  scheme: TColorScheme;
  cardStyle?: TCardStyle;
  headerControlStyle?: THeaderControlStyle;
  navLinkStyle?: TNavLinkStyle;
  hues: string;
};

const ALL_HUES = Array.from({ length: HUE_MAX - HUE_MIN }, (_, i) => i);

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
    const varyingAxes = findVaryingAxes(tokens);

    return Object.values(COLOR_SCHEME).flatMap((scheme) =>
      styleContextsFor(varyingAxes).flatMap((styles) => {
        if (isTransparentToken(foreground, styles)) return [];
        const context = { scheme, ...styles };
        const resolvedFollowsHue = tokens.some((token) =>
          tokenFollowsAccentHue(token, context),
        );
        if (resolvedFollowsHue && !followsAccentHue) {
          throw new Error(`${id} moves with the accent hue under ${scheme}`);
        }
        const varyingStyles = Object.fromEntries(
          varyingAxes.map((key) => [key, styles[key]]),
        );

        return surfaces.flatMap((surface) => {
          const failingHues = (followsAccentHue ? ALL_HUES : [0]).filter(
            (hue) =>
              measureContrast(foreground, surface, { ...context, hue }) <
              CONTRAST_ROLE_MIN[role],
          );
          if (!hasLength(failingHues)) return [];

          return {
            pair: id as TContrastPairId,
            surface,
            scheme,
            ...varyingStyles,
            hues: formatHueRanges(followsAccentHue ? failingHues : ALL_HUES),
          };
        });
      }),
    );
  });
