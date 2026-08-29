import { loadProvisionEnv } from './env';

const REQUIRED_ENV: Record<string, string> = {
  SANITY_MANAGEMENT_TOKEN: 'sanity-token',
  SANITY_ORGANIZATION_ID: 'org-abc',
  VERCEL_TOKEN: 'vercel-token',
  VERCEL_PROJECT_ID: 'proj-1',
  ADMIN_APP_BASE_URL: 'https://admin.example.com',
  PLATFORM_DOMAIN: 'example.com',
  TENANT_SANITY_DATASET: 'test-dataset',
  WEB_APP_URL: 'https://example.com',
  SANITY_REVALIDATE_SECRET: 'revalidate-shh',
};

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    originalEnv[key] = process.env[key];
    process.env[key] = REQUIRED_ENV[key];
  }
  originalEnv['VERCEL_TEAM_ID'] = process.env['VERCEL_TEAM_ID'];
  delete process.env['VERCEL_TEAM_ID'];
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
      platformDomain: 'example.com',
      tenantSanityDataset: 'test-dataset',
      webAppBaseUrl: 'https://example.com',
      revalidateSecret: 'revalidate-shh',
    });
  });

  it('carries through optional vars when set', () => {
    process.env['VERCEL_TEAM_ID'] = 'team-1';

    const env = loadProvisionEnv();

    expect(env.vercelTeamId).toBe('team-1');
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
