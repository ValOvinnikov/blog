import { hexToOklch, isHexColor } from '@shinefold/utils/color';
import { keys } from 'remeda';

import {
  COLOR_SCHEME,
  PRESET_REGISTRY,
  type TBrandVariant,
  type TPresetId,
} from '@shinefold/config/constants';

import { findPairFailures, type TContrastFailure } from './contrast-check';
import { isKnownFailure } from './contrast-known-failures';
import { CONTRAST_PAIRS, type TContrastPair } from './contrast-pairs';
import { SCHEME_RAMPS } from './contrast-scheme-ramps';
import type { TContrastScope } from './contrast-tokens';
import {
  PRESET_FILL_CONTRAST_PAIRS,
  PRESET_ROLE_CONTRAST_PAIRS,
} from './preset-role-contrast-pairs';
import type { TPresetSurfaceColors } from './preset-surface-types';
import { PRESET_SURFACES } from './preset-surfaces';
import { SKIN_CONTRAST_PAIRS, skinScopeOf, toSkinPairs } from './skin-contrast';
import { SKIN_REGISTRY } from './skins';
import type { TOklchRamp } from './theme-declarations';

export type TPresetSurfaceFailure = TContrastFailure & {
  band?: TBrandVariant;
};

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

const PAGE_PAIRS = { ...CONTRAST_PAIRS, ...PRESET_ROLE_CONTRAST_PAIRS };

const BAND_PAIRS = {
  ...SKIN_CONTRAST_PAIRS,
  ...toSkinPairs(PRESET_ROLE_CONTRAST_PAIRS),
};

const rampOf = (colors: TPresetSurfaceColors): TOklchRamp =>
  Object.fromEntries(
    Object.entries(colors)
      .filter(([, value]) => isHexColor(value))
      .map(([token, value]) => {
        const { l, c, h } = hexToOklch(value);
        return [token, { l, c, h: h ?? 0 }];
      }),
  );

const withMeasurableFills = (
  pairs: Record<string, TContrastPair>,
  ramp: TOklchRamp,
): Record<string, TContrastPair> => ({
  ...pairs,
  ...Object.fromEntries(
    Object.entries(PRESET_FILL_CONTRAST_PAIRS).filter(([, { surfaces }]) =>
      surfaces.every((surface) => surface in ramp),
    ),
  ),
});

const failuresIn = (
  pairs: Record<string, TContrastPair>,
  { scheme, ramp = SCHEME_RAMPS[scheme] }: TContrastScope,
  hue: number,
): TContrastFailure[] =>
  findPairFailures(withMeasurableFills(pairs, ramp), [{ scheme, ramp }], [hue]);

export const findPresetSurfaceFailures = (
  preset: TPresetId,
): TPresetSurfaceFailure[] => {
  const surfaces = PRESET_SURFACES[preset];
  if (!surfaces) return [];
  const hue = PRESET_REGISTRY[preset].themeTokens.accentHue;

  const pageFailures = COLOR_SCHEMES.flatMap((scheme) =>
    failuresIn(
      PAGE_PAIRS,
      {
        scheme,
        ramp: { ...SCHEME_RAMPS[scheme], ...rampOf(surfaces.page[scheme]) },
      },
      hue,
    ),
  ).filter((failure) => !isKnownFailure(failure));

  const bandFailures = keys(surfaces.bands).flatMap((band) =>
    COLOR_SCHEMES.flatMap((scheme) => {
      const { base, colors } = surfaces.bands[band][scheme];
      const generic = skinScopeOf(
        SKIN_REGISTRY[band].roles[base],
        scheme,
        base,
      );
      return failuresIn(
        BAND_PAIRS,
        { scheme, ramp: { ...generic.ramp, ...rampOf(colors) } },
        hue,
      ).map((failure) => ({ ...failure, band }));
    }),
  );

  return [...pageFailures, ...bandFailures];
};
