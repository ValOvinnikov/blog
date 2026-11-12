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
