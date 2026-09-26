import type { TFeatureHighlightItem } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const makeFeatureHighlightItem = (
  overrides: Partial<TFeatureHighlightItem> = {},
): TFeatureHighlightItem => ({
  id: 'highlight-1',
  heading: 'Fast by default',
  body: [portableTextBlock('Every page ships pre-rendered.')],
  image: makeSanityImage(),
  action: undefined,
  ...overrides,
});
