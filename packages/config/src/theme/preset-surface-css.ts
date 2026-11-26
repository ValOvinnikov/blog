import { keys } from 'remeda';

import {
  COLOR_SCHEME,
  type TBrandVariant,
  type TColorScheme,
  type TPresetId,
} from '@shinefold/config/constants';

import {
  formatBlock,
  PAGE_SCHEME_SELECTORS,
  skinSchemeSelector,
} from './css-block';
import type {
  TPresetBandSurface,
  TPresetSurfaceColors,
} from './preset-surface-types';
import { PRESET_SURFACES } from './preset-surfaces';
import { effectiveSchemeOf } from './skin-contrast';
import { roleDeclarations } from './skin-css';
import { SKIN_REGISTRY } from './skins';

const COLOR_SCHEMES = Object.values(COLOR_SCHEME);

const declarationsOf = (colors: TPresetSurfaceColors): string[] =>
  Object.entries(colors).map(([token, value]) => `${token}: ${value}`);

const redrawnSkinDeclarations = (
  variant: TBrandVariant,
  scheme: TColorScheme,
  { base }: TPresetBandSurface,
): string[] => {
  const skin = SKIN_REGISTRY[variant];
  if (effectiveSchemeOf(skin.mode, scheme) === base) return [];
  return [
    `color-scheme: ${base.toLowerCase()}`,
    ...roleDeclarations(skin.roles[base]),
  ];
};

export const formatPresetSurfaceBlock = (preset: TPresetId): string => {
  const surfaces = PRESET_SURFACES[preset];
  if (!surfaces) return '';
  const { page, bands, lengths } = surfaces;

  return [
    ...COLOR_SCHEMES.flatMap((scheme) =>
      formatBlock(PAGE_SCHEME_SELECTORS[scheme], [
        ...declarationsOf(page[scheme]),
        ...declarationsOf(lengths[scheme]),
      ]),
    ),
    ...keys(bands).flatMap((variant) =>
      COLOR_SCHEMES.flatMap((scheme) => {
        const band = bands[variant][scheme];
        return formatBlock(skinSchemeSelector(variant, scheme), [
          ...redrawnSkinDeclarations(variant, scheme, band),
          ...declarationsOf(band.colors),
        ]);
      }),
    ),
  ].join('\n');
};
