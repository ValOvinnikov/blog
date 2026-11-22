import { hasLength } from '@shinefold/utils/primitives';

import {
  COLOR_SCHEME,
  CONTRAST_ROLE_MIN,
  HUE_MAX,
  HUE_MIN,
  type TCardStyle,
  type TColorScheme,
  type THeaderControlStyle,
  type TNavLinkStyle,
} from '@shinefold/config/constants';

import {
  CONTRAST_PAIRS,
  type TContrastPair,
  type TContrastPairId,
  type TThemeToken,
} from './contrast-pairs';
import { findVaryingAxes, styleContextsFor } from './contrast-style-axes';
import {
  isTransparentToken,
  measureContrast,
  type TContrastScope,
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

export const findPairFailures = (
  pairs: Record<string, TContrastPair>,
  scopes: readonly TContrastScope[],
): TContrastFailure[] =>
  Object.entries(pairs).flatMap(([id, pair]) => {
    const { foreground, surfaces, role, followsAccentHue } = pair;
    const tokens = [foreground, ...surfaces];
    const varyingAxes = findVaryingAxes(tokens);

    return scopes.flatMap(({ scheme, ramp }) =>
      styleContextsFor(varyingAxes).flatMap((styles) => {
        if (isTransparentToken(foreground, styles)) return [];
        const context = { scheme, ramp, ...styles };
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
          const isHueDependent =
            followsAccentHue &&
            [foreground, surface].some((token) =>
              tokenFollowsAccentHue(token, context),
            );
          const failingHues = (isHueDependent ? ALL_HUES : [0]).filter(
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
            hues: formatHueRanges(isHueDependent ? failingHues : ALL_HUES),
          };
        });
      }),
    );
  });

export const findContrastFailures = (): TContrastFailure[] =>
  findPairFailures(
    CONTRAST_PAIRS,
    Object.values(COLOR_SCHEME).map((scheme) => ({ scheme })),
  );
