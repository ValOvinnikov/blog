import { faker } from '@faker-js/faker';

export const MOCK_PLATFORM_APP_BASE_URL = faker.internet.url({
  appendSlash: false,
});
export const MOCK_OPERATOR_ALERT_SECRET = faker.string.alphanumeric(32);
