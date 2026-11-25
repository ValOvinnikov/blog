import { hasLength, isOneOf } from '@shinefold/utils/primitives';

import {
  COLOR_SCHEME,
  SKIN_MODE,
  type TColorScheme,
  type TSkinMode,
} from '@shinefold/config/constants';

import { findPairFailures, type TContrastFailure } from './contrast-check';
import { KNOWN_CONTRAST_FAILURES } from './contrast-known-failures';
import {
  CONTRAST_PAIRS,
  type TContrastPair,
  type TThemeToken,
} from './contrast-pairs';
import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import {
  AMBIENT,
  AMBIENT_RAISED,
  FIELD_BOUNDARY,
  MIXED_SURFACES,
  PRIMARY_SUBTLE,
  SECONDARY,
  TOKEN_ALIASES,
} from './contrast-surfaces';
import type { TContrastScope } from './contrast-tokens';
import { PALETTE } from './palette-ramps';
import {
  BRAND_SCRIMS,
  NEUTRAL_SCRIMS,
  SKIN_ROLES,
  SKIN_SCRIM_ROLES,
  SKIN_STOP_ROLES,
  type TSkinRoles,
} from './skin-roles';
import type { TOklchRamp } from './theme-declarations';

const SKIN_SURFACE_OF: Record<TThemeToken, TThemeToken> = {
  '--primary': AMBIENT,
  [PRIMARY_SUBTLE]: AMBIENT_RAISED,
  [SECONDARY]: AMBIENT,
  ...Object.fromEntries(
    [NEUTRAL_SCRIMS, BRAND_SCRIMS].flatMap((scrims) =>
      Object.entries(scrims).map(([role, token]) => [token, role]),
    ),
  ),
};

const KNOWN_FAILING_PAIRS = new Set<string>(
  KNOWN_CONTRAST_FAILURES.map(({ pair }) => pair),
);

const SKIN_FOREGROUND_OF: Record<TThemeToken, TThemeToken> = {
  '--field-boundary-tinted': FIELD_BOUNDARY,
};

const isSkinRole = (token: TThemeToken): boolean => isOneOf(SKIN_ROLES, token);

export const partsOf = (surface: TThemeToken): TThemeToken[] => {
  const mix = MIXED_SURFACES[surface];
  return mix ? [mix.base, mix.toward] : [surface];
};

const isSkinSurface = (surface: TThemeToken): boolean =>
  partsOf(surface).every(isSkinRole);

export const SKIN_CONTRAST_PAIRS: Record<string, TContrastPair> =
  Object.fromEntries(
    Object.entries(CONTRAST_PAIRS).flatMap(([id, pair]) => {
      if (KNOWN_FAILING_PAIRS.has(id)) return [];
      const surfaces = [
        ...new Set(
          pair.surfaces.map((surface) => SKIN_SURFACE_OF[surface] ?? surface),
        ),
      ];
      const bandSurfaces = surfaces.filter(isSkinSurface);
      if (!hasLength(bandSurfaces)) return [];
      if (bandSurfaces.length !== surfaces.length) {
        throw new Error(`${id} mixes band surfaces with ones no skin sets`);
      }
      const foreground = SKIN_FOREGROUND_OF[pair.foreground] ?? pair.foreground;
      return [[id, { ...pair, foreground, surfaces, followsAccentHue: true }]];
    }),
  );

export const effectiveSchemeOf = (
  mode: TSkinMode,
  scheme: TColorScheme,
): TColorScheme => (mode === SKIN_MODE.INVERSE ? COLOR_SCHEME.DARK : scheme);

export const skinScopeOf = (
  roles: TSkinRoles,
  scheme: TColorScheme,
  effectiveScheme: TColorScheme,
): TContrastScope => {
  const baseRamp = SCHEME_RAMPS[effectiveScheme];
  const ramp: TOklchRamp = { ...baseRamp };
  for (const role of SKIN_STOP_ROLES) ramp[role] = PALETTE[roles[role]];
  for (const role of SKIN_SCRIM_ROLES) ramp[role] = baseRamp[roles[role]]!;
  return { scheme, ramp };
};

export const isSkinForeground = (
  role: TThemeToken,
  { foreground }: TContrastPair,
): boolean =>
  foreground === role ||
  (!isSkinRole(foreground) && TOKEN_ALIASES[foreground] === role);

export const pairsInvolving = (
  role: TThemeToken,
): Record<string, TContrastPair> =>
  Object.fromEntries(
    Object.entries(SKIN_CONTRAST_PAIRS).filter(
      ([, pair]) =>
        isSkinForeground(role, pair) ||
        pair.surfaces.some((surface) => partsOf(surface).includes(role)),
    ),
  );

export const findSkinFailures = (
  roles: TSkinRoles,
  scheme: TColorScheme,
  effectiveScheme: TColorScheme,
  pairs: Record<string, TContrastPair> = SKIN_CONTRAST_PAIRS,
): TContrastFailure[] =>
  findPairFailures(pairs, [skinScopeOf(roles, scheme, effectiveScheme)]);
