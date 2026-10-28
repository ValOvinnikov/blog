import { createMockFaker } from '@web/testing/mock-faker';
import type { Session } from 'next-auth';

const mockFaker = createMockFaker(61056);

export const MOCK_USER_ID = mockFaker.string.uuid();

const MOCK_SESSION_EXPIRES = mockFaker.date.future().toISOString();

export const mockSession = (overrides: Partial<Session> = {}): Session => ({
  user: { id: MOCK_USER_ID },
  expires: MOCK_SESSION_EXPIRES,
  ...overrides,
});
