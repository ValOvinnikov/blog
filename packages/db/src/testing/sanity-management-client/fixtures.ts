import { faker } from '@faker-js/faker';

faker.seed(7741);

export const MOCK_SANITY_ERROR_BODY = faker.lorem.words(2);
export const MOCK_SANITY_TOKEN = faker.string.alphanumeric(12);
export const MOCK_SANITY_PROJECT_ID = faker.string.alphanumeric(8);
export const MOCK_SANITY_DATASET = faker.string.alpha({
  length: 10,
  casing: 'lower',
});
export const MOCK_SANITY_ROBOT_ID = faker.string.alphanumeric(10);
export const MOCK_SANITY_MINTED_TOKEN = faker.string.alphanumeric(24);
export const MOCK_SANITY_PROJECT_USER_ID = faker.string.alphanumeric(8);
export const MOCK_SANITY_INVITE_EMAIL = faker.internet.email();
export const MOCK_SANITY_INVITE_ID = faker.string.alphanumeric(10);
export const MOCK_SANITY_USER_ID = `g${faker.string.alphanumeric(10)}`;
export const MOCK_SANITY_ORGANIZATION_ID = `o${faker.string.alphanumeric(8)}`;
export const MOCK_SANITY_CORS_ORIGIN = faker.internet.url({
  appendSlash: false,
});
export const MOCK_SANITY_WEBHOOK_URL = faker.internet.url({
  appendSlash: false,
});
export const MOCK_SANITY_WEBHOOK_ID = faker.string.alphanumeric(10);

export const MOCK_SANITY_EXPECTED_URL = {
  projects: 'https://api.sanity.io/v2021-06-07/projects',
  project: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}`,
  datasets: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}/datasets`,
  dataset: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}/datasets/${MOCK_SANITY_DATASET}`,
  cors: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}/cors`,
  acl: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}/acl/`,
  aclEntry: `https://api.sanity.io/v2021-06-07/projects/${MOCK_SANITY_PROJECT_ID}/acl/${MOCK_SANITY_PROJECT_USER_ID}`,
  invites: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/invites`,
  pendingAndAcceptedInvites: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/invites?status=pending&status=accepted`,
  invite: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/invites/${MOCK_SANITY_INVITE_ID}`,
  projectUsers: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/users`,
  organizationUsers: `https://api.sanity.io/v2026-07-10/access/organization/${MOCK_SANITY_ORGANIZATION_ID}/users`,
  robots: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/robots`,
  robot: `https://api.sanity.io/v2026-07-10/access/project/${MOCK_SANITY_PROJECT_ID}/robots/${MOCK_SANITY_ROBOT_ID}`,
  webhooks: `https://api.sanity.io/v2025-08-04/hooks/projects/${MOCK_SANITY_PROJECT_ID}`,
  webhook: `https://api.sanity.io/v2025-08-04/hooks/projects/${MOCK_SANITY_PROJECT_ID}/${MOCK_SANITY_WEBHOOK_ID}`,
} as const;

export function mockSanityProjectInput<T extends object>(extra: T) {
  return {
    token: MOCK_SANITY_TOKEN,
    projectId: MOCK_SANITY_PROJECT_ID,
    ...extra,
  };
}
