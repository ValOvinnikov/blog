import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { clearTenantArtifacts } from './clear-artifacts';

const { clearTenantProvisioningArtifactsMock } = vi.hoisted(() => ({
  clearTenantProvisioningArtifactsMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  clearTenantProvisioningArtifacts: clearTenantProvisioningArtifactsMock,
}));

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
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
    seededAt: new Date(),
    deprovisionedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  clearTenantProvisioningArtifactsMock.mockReset().mockResolvedValue(undefined);
});

describe(clearTenantArtifacts, () => {
  it('clears the persisted provisioning columns for the tenant', async () => {
    await clearTenantArtifacts(baseTenant(), env);

    expect(clearTenantProvisioningArtifactsMock).toHaveBeenCalledWith(
      'tenant-1',
    );
  });

  it('does not write to the row in dry-run mode', async () => {
    await clearTenantArtifacts(baseTenant(), { ...env, dryRun: true });

    expect(clearTenantProvisioningArtifactsMock).not.toHaveBeenCalled();
  });
});
