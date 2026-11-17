import { COLOR_SCHEME, type TColorScheme } from '@shinefold/config/constants';

import type { TThemeToken } from './contrast-pairs';
import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import { BRAND_PRIMARY, BRAND_PRIMARY_MUTED } from './contrast-surfaces';
import { PALETTE } from './palette-ramps';

export type TPaletteStop = keyof typeof PALETTE;

const TEXT_MUTED = '--text-muted' satisfies TThemeToken;
const BORDER_EMPHASIS = '--border-emphasis' satisfies TThemeToken;

export const SKIN_GROUND_ROLES = ['--ambient', '--backdrop'] as const;

export const SKIN_FILL_ROLES = [
  '--surface',
  '--surface-2',
  BRAND_PRIMARY_MUTED,
] as const;

const SKIN_INK_ROLES = [
  '--divider',
  '--text',
  TEXT_MUTED,
  '--text-subtle',
  '--border',
  '--border-strong',
  BORDER_EMPHASIS,
  '--field-boundary',
  BRAND_PRIMARY,
  '--brand-primary-hover',
  '--brand-primary-solid',
  '--brand-primary-solid-hover',
  '--brand-primary-contrast',
  '--success',
  '--warn',
  '--error',
  '--success-muted',
  '--warn-muted',
  '--error-muted',
] as const;

export const SKIN_STOP_ROLES = [
  ...SKIN_GROUND_ROLES,
  ...SKIN_FILL_ROLES,
  ...SKIN_INK_ROLES,
] as const;

export const SKIN_SCRIM_ROLES = [
  '--scrim-strong',
  '--scrim-mid',
  '--scrim-weak',
] as const;

// A var() in a custom property resolves where it is declared, so each scope re-declares these.
export const SKIN_ALIASES = {
  '--ring': BRAND_PRIMARY,
  '--info': BRAND_PRIMARY,
  '--info-muted': BRAND_PRIMARY_MUTED,
} as const satisfies Record<TThemeToken, TSkinStopRole>;

export type TSkinStopRole = (typeof SKIN_STOP_ROLES)[number];

export type TSkinScrimRole = (typeof SKIN_SCRIM_ROLES)[number];

export type TSkinRoles = Record<TSkinStopRole, TPaletteStop> &
  Record<TSkinScrimRole, TThemeToken>;

export const NEUTRAL_SCRIMS = {
  '--scrim-strong': '--scrim-neutral-strong',
  '--scrim-mid': '--scrim-neutral-mid',
  '--scrim-weak': '--scrim-neutral-weak',
} as const satisfies Record<TSkinScrimRole, TThemeToken>;

export const BRAND_SCRIMS = {
  '--scrim-strong': '--scrim-brand-strong',
  '--scrim-mid': '--scrim-brand-mid',
  '--scrim-weak': '--scrim-brand-weak',
} as const satisfies Record<TSkinScrimRole, TThemeToken>;

const PAGE_ROLE_SOURCES: Partial<Record<TSkinStopRole, TThemeToken>> = {
  '--ambient': '--primary',
  '--backdrop': '--primary',
  '--divider': '--border',
  '--text-subtle': TEXT_MUTED,
  '--field-boundary': BORDER_EMPHASIS,
};

const stopEquals = (
  a: (typeof PALETTE)[TPaletteStop],
  b: (typeof SCHEME_RAMPS)[TColorScheme][TThemeToken],
): boolean =>
  a.l === b.l && a.c === b.c && ('h' in a ? a.h : undefined) === b.h;

const paletteStopOf = (
  token: TThemeToken,
  scheme: TColorScheme,
): TPaletteStop => {
  const value = SCHEME_RAMPS[scheme][token];
  const stop = Object.keys(PALETTE).find(
    (key) => value && stopEquals(PALETTE[key as TPaletteStop], value),
  );
  if (!stop) throw new Error(`${token} under ${scheme} is not a palette stop`);
  return stop as TPaletteStop;
};

const pageRolesOf = (scheme: TColorScheme): TSkinRoles => ({
  ...(Object.fromEntries(
    SKIN_STOP_ROLES.map((role) => [
      role,
      paletteStopOf(PAGE_ROLE_SOURCES[role] ?? role, scheme),
    ]),
  ) as Record<TSkinStopRole, TPaletteStop>),
  ...NEUTRAL_SCRIMS,
});

export const PAGE_ROLES: Record<TColorScheme, TSkinRoles> = {
  [COLOR_SCHEME.LIGHT]: pageRolesOf(COLOR_SCHEME.LIGHT),
  [COLOR_SCHEME.DARK]: pageRolesOf(COLOR_SCHEME.DARK),
};
