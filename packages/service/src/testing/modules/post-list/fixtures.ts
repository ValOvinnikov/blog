import { BRAND_VARIANT } from '@shinefold/config';
import type { TRawPostListModule } from '@shinefold/service/features/modules/post-list/adaptor/transformer';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export function mockRawPostListModule(
  overrides: Partial<TRawPostListModule> = {},
): TRawPostListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawModuleHeadingBlock('Latest'),
    pageSize: 6,
    layout: null,
    contentAlignment: null,
    showImages: true,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
