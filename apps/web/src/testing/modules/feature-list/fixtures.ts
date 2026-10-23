import { ICONS } from '@blog/config';
import type { TFeatureListItem } from '@blog/service';
import { faker } from '@faker-js/faker';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

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
    id: faker.string.uuid(),
    headingBlock: makeHeadingBlock({ heading: 'Built for scale' }),
  }),
];
