import type {
  TCardStyle,
  TDensity,
  TGridColumns,
  TRadiusScale,
} from '@shinefold/config';
import type { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import type { InferFragmentType } from 'groqd';

export type TRawModuleAppearance = InferFragmentType<
  typeof moduleAppearanceFragment
>;

export type TModuleAppearance = {
  cardStyle?: TCardStyle;
  radiusScale?: TRadiusScale;
  density?: TDensity;
  columns?: TGridColumns;
};

export function toModuleAppearance(
  raw: TRawModuleAppearance,
): TModuleAppearance {
  return {
    cardStyle: raw.cardStyle ?? undefined,
    radiusScale: raw.radiusScale ?? undefined,
    density: raw.density ?? undefined,
    columns: raw.columns ?? undefined,
  };
}
