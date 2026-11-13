import { BRAND_VARIANT, DISPLAY_MODE } from '@blog/config';
import type { TRawPostRelatedModule } from '@blog/service/features/modules/post-related/adaptor/module/transformer';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

export const MOCK_POST_RELATED_MODULE_ID = 'post-related-1';

export function mockRawPostRelatedModule(
  overrides: Partial<TRawPostRelatedModule> = {},
): TRawPostRelatedModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Related reading'),
    limit: 3,
    layout: null,
    contentAlignment: null,
    showImages: true,
    displayMode: DISPLAY_MODE.GRID,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
