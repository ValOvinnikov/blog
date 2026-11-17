import { COLOR_SCHEME, type TColorScheme } from '@shinefold/config/constants';

import type { TThemeToken } from './contrast-pairs';
import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import {
  BORDER_EMPHASIS,
  BRAND_PRIMARY,
  BRAND_PRIMARY_MUTED,
  BRAND_PRIMARY_WASH,
  ERROR_MUTED,
  SURFACE_2,
  TEXT,
  TEXT_MUTED,
} from './contrast-surfaces';
import { PALETTE } from './palette-ramps';

export type TPaletteStop = keyof typeof PALETTE;

export const SKIN_GROUND_ROLES = ['--ambient', '--backdrop'] as const;

export const SKIN_FILL_ROLES = [
  '--surface',
  SURFACE_2,
  BRAND_PRIMARY_MUTED,
  BRAND_PRIMARY_WASH,
] as const;

const SKIN_INK_ROLES = [
  '--divider',
  TEXT,
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
  ERROR_MUTED,
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

export const SKIN_ROLES = [...SKIN_STOP_ROLES, ...SKIN_SCRIM_ROLES];

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
