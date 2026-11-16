import { faker } from '@faker-js/faker';
import type { TFaqPageQuestion } from '@shinefold/service';

export const MOCK_FAQ_PAGE_JSON_LD_FRAGMENT = '"@type":"FAQPage"';

export const MOCK_BLOG_POSTING_JSON_LD_FRAGMENT = '"@type":"BlogPosting"';

export const mockFaqPageQuestion = (
  overrides: Partial<TFaqPageQuestion> = {},
): TFaqPageQuestion => ({
  id: faker.string.uuid(),
  question: faker.lorem.sentence(),
  answer: faker.lorem.sentence(),
  ...overrides,
});
