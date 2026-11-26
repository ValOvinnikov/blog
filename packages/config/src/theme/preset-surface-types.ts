import type { TBrandVariant, TColorScheme } from '@shinefold/config/constants';

import type { TThemeToken } from './contrast-pairs';
import type { TThemeDeclarations } from './theme-declarations';

export type TPresetSurfaceColors = Record<TThemeToken, string>;

export type TPresetBandSurface = {
  base: TColorScheme;
  colors: TPresetSurfaceColors;
};

export type TPresetSurfaces = {
  page: Record<TColorScheme, TPresetSurfaceColors>;
  bands: Record<TBrandVariant, Record<TColorScheme, TPresetBandSurface>>;
  lengths: Record<TColorScheme, TThemeDeclarations>;
};
