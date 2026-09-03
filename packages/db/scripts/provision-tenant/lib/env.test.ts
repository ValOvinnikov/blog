import { loadProvisionEnv } from './env';

const REQUIRED_ENV: Record<string, string> = {
  SANITY_MANAGEMENT_TOKEN: 'sanity-token',
  SANITY_ORGANIZATION_ID: 'org-abc',
  VERCEL_TOKEN: 'vercel-token',
  VERCEL_PROJECT_ID_WEB: 'proj-1',
  ADMIN_APP_BASE_URL: 'https://admin.example.com',
  TENANT_SANITY_DATASET: 'test-dataset',
  WEB_APP_URL: 'https://example.com',
  SANITY_REVALIDATE_SECRET: 'revalidate-shh',
};

const OPTIONAL_ENV_KEYS = [
  'VERCEL_TEAM_ID',
  'GITHUB_RUN_ID',
  'GITHUB_REPOSITORY',
  'GITHUB_SERVER_URL',
  'GITHUB_ACTOR',
  'TENANT_REGISTRY_ENVIRONMENT',
  'RESEND_API_KEY',
];

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    originalEnv[key] = process.env[key];
    process.env[key] = REQUIRED_ENV[key];
  }
  for (const key of OPTIONAL_ENV_KEYS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe(loadProvisionEnv, () => {
  it('resolves every required var plus the optional ones when unset', () => {
    const env = loadProvisionEnv();

    expect(env).toEqual({
      sanityManagementToken: 'sanity-token',
      sanityOrganizationId: 'org-abc',
      vercelToken: 'vercel-token',
      vercelTeamId: undefined,
      vercelWebProjectId: 'proj-1',
      adminAppBaseUrl: 'https://admin.example.com',
      tenantSanityDataset: 'test-dataset',
      webAppBaseUrl: 'https://example.com',
      revalidateSecret: 'revalidate-shh',
      githubRunId: undefined,
      githubRepository: undefined,
      githubServerUrl: undefined,
      githubActor: undefined,
      tenantRegistryEnvironment: undefined,
      resendApiKey: undefined,
    });
  });

  it('carries through optional vars when set', () => {
    process.env['VERCEL_TEAM_ID'] = 'team-1';
    process.env['GITHUB_RUN_ID'] = '123';
    process.env['GITHUB_REPOSITORY'] = 'acme/blog';
    process.env['GITHUB_SERVER_URL'] = 'https://github.com';
    process.env['GITHUB_ACTOR'] = 'octocat';
    process.env['TENANT_REGISTRY_ENVIRONMENT'] = 'production';
    process.env['RESEND_API_KEY'] = 'resend-key';

    const env = loadProvisionEnv();

    expect(env.vercelTeamId).toBe('team-1');
    expect(env.githubRunId).toBe('123');
    expect(env.githubRepository).toBe('acme/blog');
    expect(env.githubServerUrl).toBe('https://github.com');
    expect(env.githubActor).toBe('octocat');
    expect(env.tenantRegistryEnvironment).toBe('production');
    expect(env.resendApiKey).toBe('resend-key');
  });

  it.each(Object.keys(REQUIRED_ENV))(
    'throws when %s is missing',
    (missingKey) => {
      delete process.env[missingKey];

      expect(() => loadProvisionEnv()).toThrow(
        `provision-tenant: missing required env var ${missingKey}.`,
      );
    },
  );
});
