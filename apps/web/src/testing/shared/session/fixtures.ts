import { faker } from '@faker-js/faker';
import type { Session } from 'next-auth';

export const MOCK_USER_ID = faker.string.uuid();

const MOCK_SESSION_EXPIRES = faker.date.future().toISOString();

export const mockSession = (overrides: Partial<Session> = {}): Session => ({
  user: { id: MOCK_USER_ID },
  expires: MOCK_SESSION_EXPIRES,
  ...overrides,
});
