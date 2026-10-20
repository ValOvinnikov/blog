import { faker } from '@faker-js/faker';

export const SANITY_TOKEN = faker.string.alphanumeric(12);
export const SANITY_PROJECT_ID = faker.string.alphanumeric(8);
export const SANITY_DATASET = faker.string.alpha({
  length: 10,
  casing: 'lower',
});
export const SANITY_ROBOT_ID = faker.string.alphanumeric(10);
export const SANITY_MINTED_TOKEN = faker.string.alphanumeric(24);
export const SANITY_PROJECT_USER_ID = faker.string.alphanumeric(8);
export const SANITY_INVITE_EMAIL = faker.internet.email();
export const SANITY_CORS_ORIGIN = faker.internet.url({ appendSlash: false });
export const SANITY_WEBHOOK_URL = faker.internet.url({ appendSlash: false });

export const SANITY_EXPECTED_URL = {
  projects: 'https://api.sanity.io/v2021-06-07/projects',
  datasets: `https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/datasets`,
  dataset: `https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/datasets/${SANITY_DATASET}`,
  cors: `https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/cors`,
  acl: `https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/acl/`,
  aclEntry: `https://api.sanity.io/v2021-06-07/projects/${SANITY_PROJECT_ID}/acl/${SANITY_PROJECT_USER_ID}`,
  invites: `https://api.sanity.io/v2026-07-10/access/project/${SANITY_PROJECT_ID}/invites`,
  pendingAndAcceptedInvites: `https://api.sanity.io/v2026-07-10/access/project/${SANITY_PROJECT_ID}/invites?status=pending&status=accepted`,
  robots: `https://api.sanity.io/v2026-07-10/access/project/${SANITY_PROJECT_ID}/robots`,
  robot: `https://api.sanity.io/v2026-07-10/access/project/${SANITY_PROJECT_ID}/robots/${SANITY_ROBOT_ID}`,
  webhooks: `https://api.sanity.io/v2025-08-04/hooks/projects/${SANITY_PROJECT_ID}`,
} as const;

export function withSanityProject<T extends object>(extra: T) {
  return { token: SANITY_TOKEN, projectId: SANITY_PROJECT_ID, ...extra };
}
