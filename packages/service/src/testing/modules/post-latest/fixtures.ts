import { BRAND_VARIANT, DISPLAY_MODE } from '@shinefold/config';
import type { TRawPostLatestModule } from '@shinefold/service/features/modules/post-latest/adaptor/transformer';
import { mockRawHeadingBlock } from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export function mockRawPostLatestModule(
  overrides: Partial<TRawPostLatestModule> = {},
): TRawPostLatestModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Latest'),
    limit: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
