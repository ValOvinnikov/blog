import { faker } from '@faker-js/faker';

export const MOCK_TENANT_MIGRATE_PARAMS = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.word.noun(),
  token: faker.string.alphanumeric(24),
};

export const MOCK_TENANT_MIGRATE_CLI_ENV = {
  SANITY_STUDIO_PROJECT_ID: MOCK_TENANT_MIGRATE_PARAMS.projectId,
  SANITY_STUDIO_DATASET: MOCK_TENANT_MIGRATE_PARAMS.dataset,
  SANITY_AUTH_TOKEN: MOCK_TENANT_MIGRATE_PARAMS.token,
};
