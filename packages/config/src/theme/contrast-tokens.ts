import type { TMaybeUndefined } from '@blog/config/types';
import { renderedContrastRatio, type TOklchColor } from '@blog/utils/color';
import { isUndefined } from '@blog/utils/primitives';

import {
  COLOR_SCHEME,
  type TCardStyle,
  type TColorScheme,
  type THeaderControlStyle,
  type TNavLinkStyle,
} from '@blog/config/constants';

import { ACCENT_RAMP_DARK, ACCENT_RAMP_LIGHT } from './accent-ramps';
import { CARD_STYLE_DECLARATIONS } from './card-style-declarations';
import type { TThemeToken } from './contrast-pairs';
import { NAV_LINK_STYLE_DECLARATIONS } from './nav-link-declarations';
import {
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

export type TContrastStyles = {
  cardStyle: TCardStyle;
  headerControlStyle: THeaderControlStyle;
  navLinkStyle: TNavLinkStyle;
};

export type TContrastContext = TContrastStyles & {
  scheme: TColorScheme;
  hue: number;
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

const BRAND_PRIMARY: TThemeToken = '--brand-primary';

const TOKEN_ALIASES: Record<TThemeToken, TThemeToken> = {
  '--ring': BRAND_PRIMARY,
  '--info': BRAND_PRIMARY,
  '--code-fg': '--text',
  '--code-comment': '--text-muted',
  '--field-boundary': '--border-emphasis',
};

const TRANSPARENT = 'transparent';

// A transparent header control or navigation link shows the header's own band.
const TRANSPARENT_SURFACE: TThemeToken = '--primary';

// A scrim is tested over the brightest photo it can sit on, the worst case for light copy.
const PHOTO_BACKDROP: TOklchColor = { l: 1, c: 0, h: 0 };

const styleValueOf = (
  token: TThemeToken,
  { cardStyle, headerControlStyle, navLinkStyle }: TContrastStyles,
): TMaybeUndefined<string> =>
  CARD_STYLE_DECLARATIONS[cardStyle][token] ??
  HEADER_CONTROL_STYLE_DECLARATIONS[headerControlStyle][token] ??
  NAV_LINK_STYLE_DECLARATIONS[navLinkStyle][token];

export const isTransparentToken = (
  token: TThemeToken,
  styles: TContrastStyles,
): boolean => styleValueOf(token, styles) === TRANSPARENT;

const resolveStop = (
  token: TThemeToken,
  context: Omit<TContrastContext, 'hue'>,
): TOklchRamp[TThemeToken] => {
  const { scheme } = context;
  const styleValue = styleValueOf(token, context);
  if (styleValue === TRANSPARENT) {
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
  const backdrop = isUndefined(surfaceColor.alpha)
    ? [surfaceColor]
    : [PHOTO_BACKDROP, surfaceColor];
  return renderedContrastRatio(resolveColor(foreground, context), backdrop);
};

export const tokenFollowsAccentHue = (
  token: TThemeToken,
  context: Omit<TContrastContext, 'hue'>,
): boolean => isUndefined(resolveStop(token, context).h);
