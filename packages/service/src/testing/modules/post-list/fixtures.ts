import { BRAND_VARIANT } from '@blog/config';
import type { TRawPostListModule } from '@blog/service/features/modules/post-list/adaptor/transformer';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

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
