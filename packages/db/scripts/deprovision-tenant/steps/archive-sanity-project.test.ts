import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { archiveTenantSanityProject } from './archive-sanity-project';

const { archiveSanityProjectMock } = vi.hoisted(() => ({
  archiveSanityProjectMock: vi.fn(),
}));

vi.mock(
  '@blog/db/utils/sanity-management-client/sanity-management-client',
  () => ({
    archiveSanityProject: archiveSanityProjectMock,
  }),
);

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
  archiveSanityProjectMock
    .mockReset()
    .mockResolvedValue({ outcome: 'archived' });
});

describe(archiveTenantSanityProject, () => {
  it('archives the Sanity project when one is set', async () => {
    await archiveTenantSanityProject(baseTenant(), env);

    expect(archiveSanityProjectMock).toHaveBeenCalledWith({
      token: 'mgmt-token',
      projectId: 'proj123',
    });
  });

  it('skips when no Sanity project id is set', async () => {
    await archiveTenantSanityProject(
      baseTenant({ sanityProjectId: null }),
      env,
    );

    expect(archiveSanityProjectMock).not.toHaveBeenCalled();
  });

  it('does not call the API in dry-run mode', async () => {
    await archiveTenantSanityProject(baseTenant(), { ...env, dryRun: true });

    expect(archiveSanityProjectMock).not.toHaveBeenCalled();
  });

  it('is a no-op when the project is already archived — the underlying idempotency check', async () => {
    archiveSanityProjectMock.mockResolvedValue({ outcome: 'already-archived' });

    await expect(
      archiveTenantSanityProject(baseTenant(), env),
    ).resolves.toBeUndefined();
    expect(archiveSanityProjectMock).toHaveBeenCalledTimes(1);
  });

  it('throws on a genuine archiving failure', async () => {
    archiveSanityProjectMock.mockRejectedValue(new Error('network error'));

    await expect(archiveTenantSanityProject(baseTenant(), env)).rejects.toThrow(
      'network error',
    );
  });
});
