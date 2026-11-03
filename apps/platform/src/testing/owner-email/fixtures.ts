import { faker } from '@faker-js/faker';

export const MOCK_OWNER_EMAIL_FROM_ADDRESS = faker.internet.email();
export const MOCK_PLATFORM_APP_BASE_URL = faker.internet.url({
  appendSlash: false,
});
export const MOCK_OWNER_EMAIL_SEND_ERROR = new Error(faker.lorem.sentence());
