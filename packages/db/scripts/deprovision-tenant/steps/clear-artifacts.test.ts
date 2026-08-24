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
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
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

beforeEach(() => {
  clearTenantProvisioningArtifactsMock.mockReset().mockResolvedValue(undefined);
});

describe(clearTenantArtifacts, () => {
  it('clears the persisted provisioning columns, not keeping sanityProjectId, by default', async () => {
    await clearTenantArtifacts(baseTenant(), env);

    expect(clearTenantProvisioningArtifactsMock).toHaveBeenCalledWith(
      'tenant-1',
      false,
    );
  });

  it('tells the query to keep sanityProjectId when the context says deletion was blocked', async () => {
    await clearTenantArtifacts(baseTenant(), env, {
      keepSanityProjectId: true,
    });

    expect(clearTenantProvisioningArtifactsMock).toHaveBeenCalledWith(
      'tenant-1',
      true,
    );
  });

  it('does not write to the row in dry-run mode', async () => {
    await clearTenantArtifacts(baseTenant(), { ...env, dryRun: true });

    expect(clearTenantProvisioningArtifactsMock).not.toHaveBeenCalled();
  });
});
