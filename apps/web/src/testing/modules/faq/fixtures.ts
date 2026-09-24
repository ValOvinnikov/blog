import type { TFaqQuestion } from '@blog/service';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

export const makeFaqQuestion = (
  overrides: Partial<TFaqQuestion> = {},
): TFaqQuestion => ({
  id: 'faq-1',
  question: 'Do you offer a free trial?',
  answer: [portableTextBlock('Yes, every plan includes a 14-day free trial.')],
  ...overrides,
});
