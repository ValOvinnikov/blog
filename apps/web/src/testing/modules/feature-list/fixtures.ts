import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  ICONS,
} from '@blog/config';
import type { TFeatureListItem, TFeatureListModule } from '@blog/service';
import { createMockFaker } from '@web/testing/mock-faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

const mockFaker = createMockFaker(61044);

export const mockFeatureListItem = (
  overrides: Partial<TFeatureListItem> = {},
): TFeatureListItem => ({
  id: 'feature-1',
  headingBlock: {
    heading: 'Fast by default',
    supportingText: 'Every page ships pre-rendered.',
  },
  sanityImage: undefined,
  icon: ICONS.ZAP,
  link: undefined,
  ...overrides,
});

export const MOCK_FEATURE_LIST_HEADING = 'Why choose us';

export const MOCK_FEATURE_LIST_ITEMS: TFeatureListItem[] = [
  mockFeatureListItem(),
  mockFeatureListItem({
    id: mockFaker.string.uuid(),
    headingBlock: mockHeadingBlock({ heading: 'Built for scale' }),
  }),
];

export const mockFeatureListModule = (
  overrides: Partial<TFeatureListModule> = {},
): TFeatureListModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FEATURE_LIST_HEADING }),
  items: MOCK_FEATURE_LIST_ITEMS,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.WIDE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  ...overrides,
});
