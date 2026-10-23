import type { TFeatureHighlightItem } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const mockFeatureHighlightItem = (
  overrides: Partial<TFeatureHighlightItem> = {},
): TFeatureHighlightItem => ({
  id: 'highlight-1',
  heading: 'Fast by default',
  body: [mockPortableTextBlock('Every page ships pre-rendered.')],
  image: mockSanityImage(),
  action: undefined,
  ...overrides,
});

export const MOCK_FEATURE_HIGHLIGHTS_HEADING = 'What sets us apart';

export const MOCK_FEATURE_HIGHLIGHT_ITEMS: TFeatureHighlightItem[] = [
  mockFeatureHighlightItem(),
  mockFeatureHighlightItem({
    id: faker.string.uuid(),
    heading: 'Built to last',
  }),
];
