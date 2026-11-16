import {
  CARD_STYLE,
  DENSITY,
  GRID_COLUMNS,
  RADIUS_SCALE,
} from '@shinefold/config';
import type { TRawModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';

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

export const MOCK_AUTHORED_CARD_APPEARANCE = {
  cardStyle: CARD_STYLE.RAISED,
  radiusScale: RADIUS_SCALE.XL,
  density: DENSITY.COMPACT,
} as const;

export const MOCK_AUTHORED_MODULE_APPEARANCE = {
  ...MOCK_AUTHORED_CARD_APPEARANCE,
  columns: GRID_COLUMNS.FOUR,
} as const;

export const MOCK_UNSET_MODULE_APPEARANCE = {
  cardStyle: undefined,
  radiusScale: undefined,
  density: undefined,
  columns: undefined,
} as const;
