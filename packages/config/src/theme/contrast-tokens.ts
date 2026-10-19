import { renderedContrastRatio, type TOklchColor } from '@blog/utils/color';

import {
  COLOR_SCHEME,
  type TCardStyle,
  type TColorScheme,
  type THeaderControlStyle,
} from '@blog/config/constants';

import type { TThemeToken } from './contrast-pairs';
import {
  ACCENT_RAMP_DARK,
  ACCENT_RAMP_LIGHT,
  CARD_STYLE_DECLARATIONS,
  HEADER_CONTROL_STYLE_DECLARATIONS,
  IMAGE_SCRIM_RAMP,
  type TOklchRamp,
} from './theme-declarations';
import {
  CODE_SYNTAX_RAMP_DARK,
  CODE_SYNTAX_RAMP_LIGHT,
  NEUTRAL_RAMP_DARK,
  NEUTRAL_RAMP_LIGHT,
  NEUTRAL_SCRIM_RAMP,
  STATUS_RAMP_DARK,
  STATUS_RAMP_LIGHT,
} from './theme-ramps';

export type TContrastContext = {
  scheme: TColorScheme;
  hue: number;
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
};

const SCHEME_RAMPS: Record<TColorScheme, TOklchRamp> = {
  [COLOR_SCHEME.LIGHT]: {
    ...NEUTRAL_RAMP_LIGHT,
    ...STATUS_RAMP_LIGHT,
    ...ACCENT_RAMP_LIGHT,
    ...IMAGE_SCRIM_RAMP,
    ...NEUTRAL_SCRIM_RAMP,
    ...CODE_SYNTAX_RAMP_LIGHT,
  },
  [COLOR_SCHEME.DARK]: {
    ...NEUTRAL_RAMP_DARK,
    ...STATUS_RAMP_DARK,
    ...ACCENT_RAMP_DARK,
    ...IMAGE_SCRIM_RAMP,
    ...NEUTRAL_SCRIM_RAMP,
    ...CODE_SYNTAX_RAMP_DARK,
  },
};

const TOKEN_ALIASES: Record<TThemeToken, TThemeToken> = {
  '--ring': '--brand-primary',
  '--info': '--brand-primary',
  '--code-fg': '--text',
  '--code-comment': '--text-muted',
  '--field-boundary': '--border-emphasis',
};

// A transparent header control shows the header's own band.
const TRANSPARENT_SURFACE: TThemeToken = '--primary';

// A scrim is tested over the brightest photo it can sit on, the worst case for light copy.
const PHOTO_BACKDROP: TOklchColor = { l: 1, c: 0, h: 0 };

const resolveStop = (
  token: TThemeToken,
  context: Omit<TContrastContext, 'hue'>,
): TOklchRamp[TThemeToken] => {
  const { scheme, cardStyle, headerControlStyle } = context;
  const styleValue =
    CARD_STYLE_DECLARATIONS[cardStyle][token] ??
    HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle][token];
  if (styleValue === 'transparent') {
    return resolveStop(TRANSPARENT_SURFACE, context);
  }
  const alias =
    TOKEN_ALIASES[token] ??
    (styleValue?.match(/^var\((--[\w-]+)\)$/)?.[1] as TThemeToken);
  if (alias) return resolveStop(alias, context);

  const stop = SCHEME_RAMPS[scheme][token];
  if (!stop) throw new Error(`No ${scheme} value registered for ${token}`);
  return stop;
};

const resolveColor = (
  token: TThemeToken,
  context: TContrastContext,
): TOklchColor => {
  const { h, ...stop } = resolveStop(token, context);
  return { ...stop, h: h ?? context.hue };
};

export const measureContrast = (
  foreground: TThemeToken,
  surface: TThemeToken,
  context: TContrastContext,
): number => {
  const surfaceColor = resolveColor(surface, context);
  const backdrop =
    surfaceColor.alpha === undefined
      ? [surfaceColor]
      : [PHOTO_BACKDROP, surfaceColor];
  return renderedContrastRatio(resolveColor(foreground, context), backdrop);
};

export const tokenFollowsAccentHue = (
  token: TThemeToken,
  context: Omit<TContrastContext, 'hue'>,
): boolean => resolveStop(token, context).h === undefined;
