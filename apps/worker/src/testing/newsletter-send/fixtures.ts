import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import { NEWSLETTER_SEND_PACE } from '@worker/constants/newsletter-send';
import { createMockFaker } from '@worker/testing/mock-faker';
import type { TNewsletterPageResult } from '@worker/units/newsletter-send/send-newsletter-page';
import type { TNewsletterPost } from '@worker/utils/newsletter-send/read-newsletter-post';

const mockFaker = createMockFaker(7162);

export const MOCK_CLAIMED_AT = mockFaker.date.recent().toISOString();
export const MOCK_SUBSCRIBER_IDS = Array.from({ length: 3 }, () =>
  mockFaker.string.uuid(),
);
export const MOCK_SUBSCRIBER_EMAILS = MOCK_SUBSCRIBER_IDS.map(() =>
  mockFaker.internet.email(),
);
export const MOCK_UNSUBSCRIBE_KEY = Buffer.from(
  mockFaker.string.alphanumeric(32),
).toString('base64');
export const MOCK_NEWSLETTER_FROM_ADDRESS = 'Acme <news@acme.example.com>';

export const MOCK_NEWSLETTER_POST: TNewsletterPost = {
  title: mockFaker.lorem.sentence(),
  excerpt: mockFaker.lorem.paragraph(),
  slug: mockFaker.lorem.slug(),
  publishedAt: mockFaker.date.past().toISOString(),
  isSendToSubscribersOn: true,
  coverImageUrl: mockFaker.image.url(),
  summary: [
    {
      _type: 'block',
      _key: mockFaker.string.alphanumeric(8),
      style: 'normal',
      children: [
        {
          _type: 'span',
          _key: mockFaker.string.alphanumeric(8),
          text: mockFaker.lorem.sentence(),
          marks: [],
        },
      ],
    },
  ],
};

export function mockNewsletterLimits(
  overrides: Partial<TNewsletterLimits> = {},
): TNewsletterLimits {
  return {
    activeCount: 100,
    bandCeiling: 1_000,
    allowance: 6_000,
    sentThisMonth: 0,
    ...overrides,
  };
}

export function mockNewsletterPage(
  overrides: Partial<TNewsletterPageResult> = {},
): TNewsletterPageResult {
  return {
    pace: NEWSLETTER_SEND_PACE.NORMAL,
    lastId: MOCK_SUBSCRIBER_IDS.at(-1),
    isLastPage: true,
    sentCount: MOCK_SUBSCRIBER_IDS.length,
    unreadableCount: 0,
    ...overrides,
  };
}
