import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { deleteTenantSanityProject } from './delete-sanity-project';

const { deleteSanityProjectMock } = vi.hoisted(() => ({
  deleteSanityProjectMock: vi.fn(),
}));

vi.mock('../lib/sanity-management-client', () => ({
  deleteSanityProject: deleteSanityProjectMock,
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
  deleteSanityProjectMock.mockReset().mockResolvedValue({
    alreadyGone: false,
  });
});

describe(deleteTenantSanityProject, () => {
  it('deletes the Sanity project when one is set', async () => {
    await deleteTenantSanityProject(baseTenant(), env);

    expect(deleteSanityProjectMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
  });

  it('skips when no Sanity project id is set', async () => {
    await deleteTenantSanityProject(baseTenant({ sanityProjectId: null }), env);

    expect(deleteSanityProjectMock).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await deleteTenantSanityProject(baseTenant(), { ...env, dryRun: true });

    expect(deleteSanityProjectMock).not.toHaveBeenCalled();
  });
});
