import type { queries } from '@blog/db';
import { faker } from '@faker-js/faker';

faker.seed(61059);

const SUBSCRIBER_ID = faker.string.uuid();
const SUBSCRIBER_EMAIL = faker.internet.email();

export const mockSubscriber = (
  overrides: Partial<queries.subscribers.TPendingSubscriber> = {},
): queries.subscribers.TPendingSubscriber => ({
  id: SUBSCRIBER_ID,
  email: SUBSCRIBER_EMAIL,
  ...overrides,
});
