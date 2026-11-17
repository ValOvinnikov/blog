import { hasLength, isOneOf } from '@shinefold/utils/primitives';

import {
  COLOR_SCHEME,
  SKIN_MODE,
  type TColorScheme,
  type TSkinMode,
} from '@shinefold/config/constants';

import { CODE_CONTRAST_PAIRS } from './code-contrast-pairs';
import { findPairFailures, type TContrastFailure } from './contrast-check';
import { KNOWN_CONTRAST_FAILURES } from './contrast-known-failures';
import {
  CONTRAST_PAIRS,
  type TContrastPair,
  type TThemeToken,
} from './contrast-pairs';
import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import type { TContrastScope } from './contrast-tokens';
import { PALETTE } from './palette-ramps';
import {
  BRAND_SCRIMS,
  NEUTRAL_SCRIMS,
  SKIN_ALIASES,
  SKIN_SCRIM_ROLES,
  SKIN_STOP_ROLES,
  type TSkinRoles,
} from './skin-roles';
import type { TOklchRamp } from './theme-declarations';

const SKIN_ROLES = [...SKIN_STOP_ROLES, ...SKIN_SCRIM_ROLES];

const AMBIENT = '--ambient' satisfies TThemeToken;

const SKIN_SURFACE_OF: Record<TThemeToken, TThemeToken> = {
  '--primary': AMBIENT,
  '--primary-subtle': AMBIENT,
  '--secondary': AMBIENT,
  ...Object.fromEntries(
    [NEUTRAL_SCRIMS, BRAND_SCRIMS].flatMap((scrims) =>
      Object.entries(scrims).map(([role, token]) => [token, role]),
    ),
  ),
};

// A skin's own --field-boundary against its ground replaces the tinted boundary, and code colours are page-wide, not skin roles.
const PAIRS_OUTSIDE_SKINS = new Set<string>([
  ...KNOWN_CONTRAST_FAILURES.map(({ pair }) => pair),
  'FIELD_BOUNDARY_TINTED',
  ...Object.keys(CODE_CONTRAST_PAIRS),
]);

const isSkinRole = (token: TThemeToken): boolean => isOneOf(SKIN_ROLES, token);

export const SKIN_CONTRAST_PAIRS: Record<string, TContrastPair> =
  Object.fromEntries(
    Object.entries(CONTRAST_PAIRS).flatMap(([id, pair]) => {
      if (PAIRS_OUTSIDE_SKINS.has(id)) return [];
      const surfaces = [
        ...new Set(
          pair.surfaces.map((surface) => SKIN_SURFACE_OF[surface] ?? surface),
        ),
      ].filter(isSkinRole);
      if (!hasLength(surfaces)) return [];
      return [[id, { ...pair, surfaces, followsAccentHue: true }]];
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
  for (const [alias, role] of Object.entries(SKIN_ALIASES)) {
    ramp[alias as TThemeToken] = PALETTE[roles[role]];
  }
  return { scheme, ramp };
};

export const isSkinForeground = (
  role: TThemeToken,
  { foreground }: TContrastPair,
): boolean =>
  foreground === role ||
  SKIN_ALIASES[foreground as keyof typeof SKIN_ALIASES] === role;

export const pairsInvolving = (
  role: TThemeToken,
): Record<string, TContrastPair> =>
  Object.fromEntries(
    Object.entries(SKIN_CONTRAST_PAIRS).filter(
      ([, pair]) =>
        isSkinForeground(role, pair) || pair.surfaces.includes(role),
    ),
  );

export const findSkinFailures = (
  roles: TSkinRoles,
  scheme: TColorScheme,
  effectiveScheme: TColorScheme,
  pairs: Record<string, TContrastPair> = SKIN_CONTRAST_PAIRS,
): TContrastFailure[] =>
  findPairFailures(pairs, [skinScopeOf(roles, scheme, effectiveScheme)]);
