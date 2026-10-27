import { faker } from '@faker-js/faker';

export const MOCK_SANITY_MANAGEMENT_TOKEN = faker.string.alphanumeric(24);

export const MOCK_RECHECK_ENV = {
  sanityManagementToken: MOCK_SANITY_MANAGEMENT_TOKEN,
};
