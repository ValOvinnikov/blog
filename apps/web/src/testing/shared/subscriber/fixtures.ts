import type { queries } from '@blog/db';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61059);

const SUBSCRIBER_ID = mockFaker.string.uuid();
const SUBSCRIBER_EMAIL = mockFaker.internet.email();

export const mockSubscriber = (
  overrides: Partial<queries.subscribers.TPendingSubscriber> = {},
): queries.subscribers.TPendingSubscriber => ({
  id: SUBSCRIBER_ID,
  email: SUBSCRIBER_EMAIL,
  ...overrides,
});
