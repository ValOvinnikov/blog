import { faker } from '@faker-js/faker';
import type { Session } from 'next-auth';

export const MOCK_OPERATOR_ID = faker.string.uuid();
export const MOCK_OPERATOR_EMAIL = faker.internet.email();

export const MOCK_OPERATOR_SESSION: Session = {
  user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
  expires: '2099-01-01T00:00:00.000Z',
};
