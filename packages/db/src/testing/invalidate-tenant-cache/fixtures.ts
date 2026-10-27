import { faker } from '@faker-js/faker';

export const MOCK_WEB_APP_URL = faker.internet.url({ appendSlash: false });
export const MOCK_SITE_CONFIG_REVALIDATE_SECRET = faker.string.alphanumeric(32);

export const MOCK_INVALIDATE_CACHE_ENV = {
  webAppUrl: MOCK_WEB_APP_URL,
  siteConfigRevalidateSecret: MOCK_SITE_CONFIG_REVALIDATE_SECRET,
  dryRun: false,
};
