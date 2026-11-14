import { CARD_STYLE, DENSITY, GRID_COLUMNS, RADIUS_SCALE } from '@blog/config';
import type { TRawModuleAppearance } from '@blog/service/shared/transformers/module/to-module-appearance';

export function mockRawModuleAppearance(
  overrides: Partial<TRawModuleAppearance> = {},
): TRawModuleAppearance {
  return {
    cardStyle: null,
    radiusScale: null,
    density: null,
    columns: null,
    ...overrides,
  };
}

export const MOCK_AUTHORED_MODULE_APPEARANCE = {
  cardStyle: CARD_STYLE.RAISED,
  radiusScale: RADIUS_SCALE.XL,
  density: DENSITY.COMPACT,
  columns: GRID_COLUMNS.FOUR,
} as const;
