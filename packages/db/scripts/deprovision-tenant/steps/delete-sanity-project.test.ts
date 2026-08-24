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
    const result = await deleteTenantSanityProject(baseTenant(), env);

    expect(deleteSanityProjectMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
    expect(result).toBeUndefined();
  });

  it('skips when no Sanity project id is set', async () => {
    await deleteTenantSanityProject(baseTenant({ sanityProjectId: null }), env);

    expect(deleteSanityProjectMock).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await deleteTenantSanityProject(baseTenant(), { ...env, dryRun: true });

    expect(deleteSanityProjectMock).not.toHaveBeenCalled();
  });

  it('reports keepSanityProjectId when deletion is blocked by org billing permission', async () => {
    deleteSanityProjectMock.mockResolvedValue({
      alreadyGone: false,
      blockedByBillingPermission: true,
    });

    await expect(deleteTenantSanityProject(baseTenant(), env)).resolves.toEqual(
      { keepSanityProjectId: true },
    );
  });

  it('still throws on a non-billing-permission failure', async () => {
    deleteSanityProjectMock.mockRejectedValue(new Error('network error'));

    await expect(deleteTenantSanityProject(baseTenant(), env)).rejects.toThrow(
      'network error',
    );
  });
});
