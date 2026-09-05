import type { TTenant } from '@blog/db/schema/tenants';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';

import type { TDeprovisionEnv } from '../lib/env';

import {
  revokeTenantSanityTokens,
  type TRevokeSanityTokensDeps,
} from './revoke-sanity-tokens';

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'READY',
    provisioningSteps: null,
    studioVercelProjectId: 'prj_studio',
    seededAt: new Date(),
    deprovisionedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

function deps(
  overrides: Partial<TRevokeSanityTokensDeps> = {},
): TRevokeSanityTokensDeps {
  return {
    listRobotTokens: vi.fn().mockResolvedValue([]),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe(revokeTenantSanityTokens, () => {
  it('skips when no Sanity project id is set', async () => {
    const testDeps = deps();

    await revokeTenantSanityTokens(
      baseTenant({ sanityProjectId: null }),
      env,
      testDeps,
    );

    expect(testDeps.listRobotTokens).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    const testDeps = deps();

    await revokeTenantSanityTokens(
      baseTenant(),
      { ...env, dryRun: true },
      testDeps,
    );

    expect(testDeps.listRobotTokens).not.toHaveBeenCalled();
    expect(testDeps.revokeToken).not.toHaveBeenCalled();
  });

  it('lists the project robots and deletes only the provisioned read/write tokens by label', async () => {
    const testDeps = deps({
      listRobotTokens: vi.fn().mockResolvedValue([
        { id: 'robot-read', label: SANITY_READ_TOKEN_LABEL },
        { id: 'robot-write', label: SANITY_WRITE_TOKEN_LABEL },
        { id: 'robot-human', label: 'someone@example.com' },
      ]),
    });

    await revokeTenantSanityTokens(baseTenant(), env, testDeps);

    expect(testDeps.listRobotTokens).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
    expect(testDeps.revokeToken).toHaveBeenCalledTimes(2);
    expect(testDeps.revokeToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-read',
    });
    expect(testDeps.revokeToken).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
      robotId: 'robot-write',
    });
  });

  it('does nothing when no robot matches a provisioned label', async () => {
    const testDeps = deps({
      listRobotTokens: vi
        .fn()
        .mockResolvedValue([
          { id: 'robot-human', label: 'someone@example.com' },
        ]),
    });

    await revokeTenantSanityTokens(baseTenant(), env, testDeps);

    expect(testDeps.revokeToken).not.toHaveBeenCalled();
  });

  it('does not throw and still attempts the other matched token when one deletion fails', async () => {
    const revokeToken = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(undefined);
    const testDeps = deps({
      listRobotTokens: vi.fn().mockResolvedValue([
        { id: 'robot-read', label: SANITY_READ_TOKEN_LABEL },
        { id: 'robot-write', label: SANITY_WRITE_TOKEN_LABEL },
      ]),
      revokeToken,
    });

    await expect(
      revokeTenantSanityTokens(baseTenant(), env, testDeps),
    ).resolves.toBeUndefined();

    expect(revokeToken).toHaveBeenCalledTimes(2);
  });

  it('does not throw when listing the project robots fails', async () => {
    const testDeps = deps({
      listRobotTokens: vi.fn().mockRejectedValue(new Error('network error')),
    });

    await expect(
      revokeTenantSanityTokens(baseTenant(), env, testDeps),
    ).resolves.toBeUndefined();

    expect(testDeps.revokeToken).not.toHaveBeenCalled();
  });
});
