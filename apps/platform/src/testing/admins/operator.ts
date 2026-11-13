import { faker } from '@faker-js/faker';
import { MOCK_SESSION_EXPIRES } from '@platform/testing/auth/fixtures';
import type { Session } from 'next-auth';

export const MOCK_OPERATOR_ID = faker.string.uuid();
export const MOCK_OPERATOR_EMAIL = faker.internet.email();

export const MOCK_OPERATOR_SESSION: Session = {
  user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
  expires: MOCK_SESSION_EXPIRES,
};
