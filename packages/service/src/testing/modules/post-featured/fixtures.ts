import { BRAND_VARIANT, DISPLAY_MODE, POST_SOURCE } from '@blog/config';
import type { TRawPostFeaturedModule } from '@blog/service/features/modules/post-featured/adaptor/transformer';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

export function mockRawPostFeaturedModule(
  overrides: Partial<TRawPostFeaturedModule> = {},
): TRawPostFeaturedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Featured'),
    postSource: POST_SOURCE.PINNED,
    posts: [],
    limit: null,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
