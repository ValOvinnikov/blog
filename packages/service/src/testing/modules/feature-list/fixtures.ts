import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  ICONS,
} from '@blog/config';
import type { TRawFeatureListModule } from '@blog/service/features/modules/feature-list/adaptor/transformer';
import { MOCK_SHIP_FASTER_HEADING } from '@blog/service/testing/modules/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

export const MOCK_FEATURE_LIST_MODULE_ID = 'feature-list-1';

type TRawFeatureListItem = NonNullable<
  TRawFeatureListModule['features']
>[number];

export function mockRawFeatureListItem(
  overrides: Partial<TRawFeatureListItem> = {},
): TRawFeatureListItem {
  return {
    _id: 'block-feature-1',
    headingBlock: mockRawHeadingBlock(MOCK_SHIP_FASTER_HEADING),
    icon: ICONS.ROCKET,
    image: null,
    link: null,
    ...overrides,
  };
}

export function mockRawFeatureListModule(
  overrides: Partial<TRawFeatureListModule> = {},
): TRawFeatureListModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Features'),
    features: [
      mockRawFeatureListItem(),
      mockRawFeatureListItem({ _id: 'block-feature-2' }),
    ],
    ctaButtons: null,
    imageShape: CARD_IMAGE_SHAPE.WIDE,
    displayMode: DISPLAY_MODE.GRID,
    contentAlignment: null,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
