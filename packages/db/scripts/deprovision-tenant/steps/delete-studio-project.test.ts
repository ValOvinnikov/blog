import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { deleteTenantStudioProject } from './delete-studio-project';

const { deleteVercelProjectMock } = vi.hoisted(() => ({
  deleteVercelProjectMock: vi.fn(),
}));

vi.mock('../lib/vercel-client', () => ({
  deleteVercelProject: deleteVercelProjectMock,
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
  deleteVercelProjectMock.mockReset().mockResolvedValue({
    alreadyGone: false,
  });
});

describe(deleteTenantStudioProject, () => {
  it('deletes the Studio Vercel project when one is set', async () => {
    await deleteTenantStudioProject(baseTenant(), env);

    expect(deleteVercelProjectMock).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      projectId: 'prj_studio',
    });
  });

  it('skips when no Studio project id is set', async () => {
    await deleteTenantStudioProject(
      baseTenant({ studioVercelProjectId: null }),
      env,
    );

    expect(deleteVercelProjectMock).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await deleteTenantStudioProject(baseTenant(), { ...env, dryRun: true });

    expect(deleteVercelProjectMock).not.toHaveBeenCalled();
  });
});
