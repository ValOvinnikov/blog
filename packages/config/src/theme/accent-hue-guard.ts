import { hasLength } from '@shinefold/utils/primitives';

import { COLOR_SCHEME } from '@shinefold/config/constants';

import { findPairFailures } from './contrast-check';
import { isKnownFailure } from './contrast-known-failures';
import {
  CONTRAST_PAIRS,
  type TContrastPair,
  type TContrastPairId,
} from './contrast-pairs';

const ACCENT_PAIRS: Partial<Record<TContrastPairId, TContrastPair>> =
  Object.fromEntries(
    Object.entries(CONTRAST_PAIRS).filter(
      ([, { followsAccentHue }]) => followsAccentHue,
    ),
  );

const SCHEME_SCOPES = Object.values(COLOR_SCHEME).map((scheme) => ({
  scheme,
}));

export const findFailingAccentPairs = (hue: number): TContrastPairId[] => [
  ...new Set(
    findPairFailures(ACCENT_PAIRS, SCHEME_SCOPES, [hue])
      .filter((failure) => !isKnownFailure(failure))
      .map(({ pair }) => pair),
  ),
];

export const isAccentHueAccessible = (hue: number): boolean =>
  !hasLength(findFailingAccentPairs(hue));
