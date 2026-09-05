import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { removeTenantDomain } from './remove-domain';

const { deleteVercelProjectDomainMock } = vi.hoisted(() => ({
  deleteVercelProjectDomainMock: vi.fn(),
}));

vi.mock('../lib/vercel-client', () => ({
  deleteVercelProjectDomain: deleteVercelProjectDomainMock,
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
  deleteVercelProjectDomainMock.mockReset().mockResolvedValue({
    alreadyGone: false,
  });
});

describe(removeTenantDomain, () => {
  it('removes the domain from the shared web project', async () => {
    await removeTenantDomain(baseTenant(), env);

    expect(deleteVercelProjectDomainMock).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      projectId: 'prj_web',
      domain: 'acme.example.com',
    });
  });

  it('does not call the API in dry-run mode', async () => {
    await removeTenantDomain(baseTenant(), { ...env, dryRun: true });

    expect(deleteVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
