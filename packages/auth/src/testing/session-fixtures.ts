import { faker } from '@faker-js/faker';

export const MOCK_SESSION_TOKEN = faker.string.uuid();
export const MOCK_SESSION_EXPIRES = faker.date.future();
export const MOCK_USER_ID = faker.string.uuid();
export const MOCK_PROVIDER = faker.lorem.word();
export const MOCK_PROVIDER_ACCOUNT_ID = faker.string.numeric(8);
export const MOCK_EMAIL = faker.internet.exampleEmail();
export const MOCK_AUTH_SECRET = faker.string.alphanumeric(32);
