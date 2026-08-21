import { loadDeprovisionEnv } from './env';

const REQUIRED_ENV: Record<string, string> = {
  SANITY_MANAGEMENT_TOKEN: 'sanity-token',
  VERCEL_TOKEN: 'vercel-token',
  VERCEL_PROJECT_ID: 'proj-1',
};

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of Object.keys(REQUIRED_ENV)) {
    originalEnv[key] = process.env[key];
    process.env[key] = REQUIRED_ENV[key];
  }
  for (const key of ['VERCEL_TEAM_ID', 'GITHUB_ACTOR', 'GITHUB_RUN_ID']) {
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

describe(loadDeprovisionEnv, () => {
  it('resolves every required var plus the given dryRun flag', () => {
    const env = loadDeprovisionEnv(true);

    expect(env).toEqual({
      sanityManagementToken: 'sanity-token',
      vercelToken: 'vercel-token',
      vercelTeamId: undefined,
      vercelWebProjectId: 'proj-1',
      dryRun: true,
      githubActor: undefined,
      githubRunId: undefined,
    });
  });

  it('carries through the optional team id when set', () => {
    process.env['VERCEL_TEAM_ID'] = 'team-1';

    const env = loadDeprovisionEnv(false);

    expect(env.vercelTeamId).toBe('team-1');
    expect(env.dryRun).toBe(false);
  });

  it('carries through GITHUB_ACTOR/GITHUB_RUN_ID when set, without requiring them', () => {
    process.env['GITHUB_ACTOR'] = 'octocat';
    process.env['GITHUB_RUN_ID'] = 'run-42';

    const env = loadDeprovisionEnv(true);

    expect(env.githubActor).toBe('octocat');
    expect(env.githubRunId).toBe('run-42');
  });

  it('does not throw when GITHUB_ACTOR/GITHUB_RUN_ID are unset', () => {
    expect(() => loadDeprovisionEnv(true)).not.toThrow();
  });

  it.each(Object.keys(REQUIRED_ENV))(
    'throws when %s is missing',
    (missingKey) => {
      delete process.env[missingKey];

      expect(() => loadDeprovisionEnv(true)).toThrow(
        `deprovision-tenant: missing required env var ${missingKey}.`,
      );
    },
  );
});
