import { BRAND_VARIANT } from '@shinefold/config';
import type { TRawPostListModule } from '@shinefold/service/features/modules/post-list/adaptor/transformer';
import { mockRawHeadingBlock } from '@shinefold/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export function mockRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Latest'),
    pageSize: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
