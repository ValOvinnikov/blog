import { ICONS } from '@blog/config';
import type { TFeatureListItem } from '@blog/service';

export const makeFeatureListItem = (
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
