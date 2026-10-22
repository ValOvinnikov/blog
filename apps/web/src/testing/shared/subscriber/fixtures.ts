import type { queries } from '@blog/db';
import { faker } from '@faker-js/faker';

const SUBSCRIBER_ID = faker.string.uuid();
const SUBSCRIBER_EMAIL = faker.internet.email();

export const makeSubscriber = (
  overrides: Partial<queries.subscribers.TPendingSubscriber> = {},
): queries.subscribers.TPendingSubscriber => ({
  id: SUBSCRIBER_ID,
  email: SUBSCRIBER_EMAIL,
  ...overrides,
});
