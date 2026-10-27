import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { faker } from '@faker-js/faker';

import { loadDeprovisionEnv } from './env';

faker.seed(5765);

const MOCK_ENV = {
  ...MOCK_DEPROVISION_ENV,
  vercelTeamId: `team_${faker.string.alphanumeric(12)}`,
};

const REQUIRED_ENV_VARS = {
  SANITY_MANAGEMENT_TOKEN: MOCK_ENV.sanityManagementToken,
  VERCEL_TOKEN: MOCK_ENV.vercelToken,
  VERCEL_PROJECT_ID_WEB: MOCK_ENV.vercelWebProjectId,
};

const OPTIONAL_ENV_VARS = {
  VERCEL_TEAM_ID: MOCK_ENV.vercelTeamId,
  GITHUB_ACTOR: MOCK_ENV.githubActor,
  GITHUB_RUN_ID: MOCK_ENV.githubRunId,
  GITHUB_REPOSITORY: MOCK_ENV.githubRepository,
  GITHUB_SERVER_URL: MOCK_ENV.githubServerUrl,
  WEB_APP_URL: MOCK_ENV.webAppUrl,
  SITE_CONFIG_REVALIDATE_SECRET: MOCK_ENV.siteConfigRevalidateSecret,
};

function stubEnvVars(vars: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(vars)) {
    vi.stubEnv(name, value);
  }
}

describe(loadDeprovisionEnv, () => {
  beforeEach(() => {
    stubEnvVars(REQUIRED_ENV_VARS);
    stubEnvVars(
      Object.fromEntries(
        Object.keys(OPTIONAL_ENV_VARS).map((name) => [name, undefined]),
      ),
    );
  });

  it.each([true, false])('resolves every var with dryRun %s', (dryRun) => {
    stubEnvVars(OPTIONAL_ENV_VARS);

    const env = loadDeprovisionEnv(dryRun);

    expect(env).toEqual({ ...MOCK_ENV, dryRun });
  });

  it('leaves the optional vars undefined without throwing when unset', () => {
    const env = loadDeprovisionEnv(true);

    expect(env).toEqual({
      ...MOCK_ENV,
      dryRun: true,
      vercelTeamId: undefined,
      githubActor: undefined,
      githubRunId: undefined,
      githubRepository: undefined,
      githubServerUrl: undefined,
      webAppUrl: undefined,
      siteConfigRevalidateSecret: undefined,
    });
  });

  it.each(Object.keys(REQUIRED_ENV_VARS))(
    'throws when %s is missing',
    (missingKey) => {
      vi.stubEnv(missingKey, undefined);

      expect(() => loadDeprovisionEnv(true)).toThrow(
        `deprovision-tenant: missing required env var ${missingKey}.`,
      );
    },
  );
});
