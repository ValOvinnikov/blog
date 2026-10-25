import { GITHUB_AUDIT_ACTOR_ID_PREFIX } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

export const MOCK_DEPROVISION_ENV = {
  sanityManagementToken: faker.string.alphanumeric(24),
  vercelToken: faker.string.alphanumeric(24),
  vercelTeamId: undefined,
  vercelWebProjectId: `prj_${faker.string.alphanumeric(12)}`,
  dryRun: false,
  githubActor: faker.internet.username(),
  githubRunId: faker.string.numeric(10),
  githubRepository: `${faker.internet.username()}/${faker.word.noun()}`,
  githubServerUrl: faker.internet.url({ appendSlash: false }),
  webAppUrl: faker.internet.url({ appendSlash: false }),
  siteConfigRevalidateSecret: faker.string.alphanumeric(32),
};

export const MOCK_PURGED_READER_DATA_COUNTS = {
  subscribers: 3,
  bookmarks: 5,
  membershipInvites: 1,
  leads: 2,
};

export const MOCK_DEPROVISION_AUDIT_ACTOR = {
  actorId: `${GITHUB_AUDIT_ACTOR_ID_PREFIX}${MOCK_DEPROVISION_ENV.githubActor}`,
};
