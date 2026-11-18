import { hasLength, isOneOf, objectKeys } from '@shinefold/utils/primitives';

import type { TColorScheme } from '@shinefold/config/constants';

import type { TThemeToken } from './contrast-pairs';
import { AMBIENT, AMBIENT_RAISED } from './contrast-surfaces';
import { PALETTE } from './palette-ramps';
import {
  findSkinFailures,
  isSkinForeground,
  pairsInvolving,
  SKIN_CONTRAST_PAIRS,
} from './skin-contrast';
import {
  BRAND_SCRIMS,
  NEUTRAL_SCRIMS,
  PAGE_ROLES,
  SKIN_FILL_ROLES,
  SKIN_GROUND_ROLES,
  SKIN_STOP_ROLES,
  type TPaletteStop,
  type TSkinRoles,
  type TSkinStopRole,
} from './skin-roles';

export type TSkinDerivation = {
  title: string;
  ground: TPaletteStop;
  scheme: TColorScheme;
  effectiveScheme: TColorScheme;
  pin: Partial<TSkinRoles>;
};

type TMaybeGround = TPaletteStop | false;

const PALETTE_STOPS = objectKeys(PALETTE);

const BRAND_FAMILY = '--palette-brand';

const familyOf = (stop: TPaletteStop): string => stop.replace(/-\d+$/, '');

export const isBrandStop = (stop: TPaletteStop): boolean =>
  familyOf(stop) === BRAND_FAMILY;

const lightnessGap = (from: TPaletteStop, to: TPaletteStop): number =>
  Math.abs(PALETTE[from].l - PALETTE[to].l);

const chromaGap = (from: TPaletteStop, to: TPaletteStop): number =>
  Math.abs(PALETTE[from].c - PALETTE[to].c);

const candidatesFor = (
  current: TPaletteStop,
  ground: TMaybeGround,
): TPaletteStop[] =>
  PALETTE_STOPS.filter(
    (stop) => familyOf(stop) === familyOf(current) && stop !== ground,
  ).sort(
    (a, b) =>
      lightnessGap(current, a) - lightnessGap(current, b) ||
      chromaGap(current, a) - chromaGap(current, b),
  );

const failuresOf = (
  role: TThemeToken,
  roles: TSkinRoles,
  { scheme, effectiveScheme }: TSkinDerivation,
) =>
  findSkinFailures(roles, scheme, effectiveScheme, pairsInvolving(role)).filter(
    ({ pair, surface }) =>
      surface === role || isSkinForeground(role, SKIN_CONTRAST_PAIRS[pair]!),
  );

const settleRole = (
  role: TSkinStopRole,
  roles: TSkinRoles,
  derivation: TSkinDerivation,
): TPaletteStop => {
  const ground = isOneOf(SKIN_FILL_ROLES, role) && derivation.ground;
  const settled = candidatesFor(roles[role], ground).find(
    (stop) =>
      !hasLength(failuresOf(role, { ...roles, [role]: stop }, derivation)),
  );
  if (!settled) {
    throw new Error(`${derivation.title}: no ${role} stop clears its pairs`);
  }
  return settled;
};

export const deriveSkinRoles = (derivation: TSkinDerivation): TSkinRoles => {
  const { ground, scheme, effectiveScheme, pin } = derivation;
  const movable = SKIN_STOP_ROLES.filter(
    (role) => !(role in pin) && !isOneOf(SKIN_GROUND_ROLES, role),
  ).sort(
    (a, b) =>
      Number(isOneOf(SKIN_FILL_ROLES, a)) - Number(isOneOf(SKIN_FILL_ROLES, b)),
  );
  let roles: TSkinRoles = {
    ...PAGE_ROLES[effectiveScheme],
    [AMBIENT]: ground,
    '--backdrop': ground,
    [AMBIENT_RAISED]: ground,
    ...(isBrandStop(ground) ? BRAND_SCRIMS : NEUTRAL_SCRIMS),
    ...pin,
  };

  const holds = (candidate: TSkinRoles): boolean =>
    SKIN_FILL_ROLES.every((fill) => candidate[fill] !== ground) &&
    !hasLength(findSkinFailures(candidate, scheme, effectiveScheme));

  for (let pass = 0; pass <= movable.length && !holds(roles); pass += 1) {
    const before = roles;
    for (const role of movable) {
      roles = { ...roles, [role]: settleRole(role, roles, derivation) };
    }
    if (movable.every((role) => roles[role] === before[role])) break;
  }
  if (!holds(roles)) {
    throw new Error(`${derivation.title}: its roles fail their pairs`);
  }
  return roles;
};
