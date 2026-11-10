import {
  CARD_STYLE,
  HEADER_CONTROL_STYLE,
  NAV_LINK_STYLE,
} from '@blog/config/constants';

import type { TThemeToken } from './contrast-pairs';
import type { TContrastStyles } from './contrast-tokens';
import { NAV_LINK_STYLE_DECLARATIONS } from './nav-link-declarations';
import {
  CARD_STYLE_DECLARATIONS,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  type TThemeDeclarations,
} from './theme-declarations';

export type TStyleAxisKey = keyof TContrastStyles;

type TStyleAxis<TStyle extends string> = {
  declarations: Record<TStyle, TThemeDeclarations>;
  fallback: TStyle;
};

const STYLE_AXES: {
  [K in keyof TContrastStyles]: TStyleAxis<TContrastStyles[K]>;
} = {
  cardStyle: {
    declarations: CARD_STYLE_DECLARATIONS,
    fallback: CARD_STYLE.ACCENT_BAR,
  },
  headerControlStyle: {
    declarations: HEADER_CONTROL_STYLE_DECLARATIONS,
    fallback: HEADER_CONTROL_STYLE.OUTLINED,
  },
  navLinkStyle: {
    declarations: NAV_LINK_STYLE_DECLARATIONS,
    fallback: NAV_LINK_STYLE.PLAIN,
  },
};

const STYLE_AXIS_KEYS = Object.keys(STYLE_AXES) as TStyleAxisKey[];

const axisTokens = (axis: TStyleAxis<string>): Set<string> =>
  new Set(Object.values(axis.declarations).flatMap(Object.keys));

const STYLE_AXIS_TOKENS = Object.fromEntries(
  STYLE_AXIS_KEYS.map((key) => [key, axisTokens(STYLE_AXES[key])]),
) as Record<TStyleAxisKey, Set<string>>;

export const findVaryingAxes = (
  tokens: readonly TThemeToken[],
): TStyleAxisKey[] =>
  STYLE_AXIS_KEYS.filter((key) =>
    tokens.some((token) => STYLE_AXIS_TOKENS[key].has(token)),
  );

export const styleContextsFor = (
  varyingAxes: readonly TStyleAxisKey[],
): TContrastStyles[] =>
  STYLE_AXIS_KEYS.reduce<Partial<TContrastStyles>[]>(
    (contexts, key) => {
      const { declarations, fallback } = STYLE_AXES[key];
      const styles = varyingAxes.includes(key)
        ? Object.keys(declarations)
        : [fallback];
      return contexts.flatMap((context) =>
        styles.map((style) => ({ ...context, [key]: style })),
      );
    },
    [{}],
  ) as TContrastStyles[];
