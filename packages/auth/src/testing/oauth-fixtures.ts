import { OAUTH_PROVIDER } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

export const MOCK_GITHUB_ID = faker.string.alphanumeric(20);
export const MOCK_GITHUB_SECRET = faker.string.alphanumeric(40);
export const MOCK_GOOGLE_ID = faker.string.alphanumeric(20);
export const MOCK_GOOGLE_SECRET = faker.string.alphanumeric(40);
export const MOCK_SITE_GITHUB_ID = faker.string.alphanumeric(20);
export const MOCK_SITE_GITHUB_SECRET = faker.string.alphanumeric(40);
export const MOCK_REDIRECT_PROXY_URL = faker.internet.url();

export const MOCK_SITE_GITHUB_CREDENTIALS = {
  [OAUTH_PROVIDER.GITHUB]: {
    clientId: MOCK_SITE_GITHUB_ID,
    clientSecret: MOCK_SITE_GITHUB_SECRET,
  },
};
