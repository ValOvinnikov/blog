import { BRAND_VARIANT } from '@shinefold/config';
import type { TFaqModule, TFaqQuestion } from '@shinefold/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const mockFaqQuestion = (
  overrides: Partial<TFaqQuestion> = {},
): TFaqQuestion => ({
  id: 'faq-1',
  question: 'Do you offer a free trial?',
  answer: [
    mockPortableTextBlock('Yes, every plan includes a 14-day free trial.'),
  ],
  ...overrides,
});

export const MOCK_FAQ_HEADING = 'Frequently asked questions';

export const mockFaqModule = (
  overrides: Partial<TFaqModule> = {},
): TFaqModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: MOCK_FAQ_HEADING }),
  questions: [],
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
