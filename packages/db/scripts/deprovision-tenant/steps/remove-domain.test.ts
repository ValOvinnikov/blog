import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { removeTenantDomain } from './remove-domain';

const TENANT_DOMAIN = 'acme.example.com';

const { deleteVercelProjectDomainMock } = vi.hoisted(() => ({
  deleteVercelProjectDomainMock: vi.fn(),
}));

vi.mock('@blog/db/utils/vercel-client/vercel-project-domains', () => ({
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
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: TENANT_DOMAIN,
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'enc',
    locale: LOCALE_ISO_CODES.EN,
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
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
      token: env.vercelToken,
      teamId: undefined,
      projectId: env.vercelWebProjectId,
      domain: TENANT_DOMAIN,
    });
  });

  it('does not call the API in dry-run mode', async () => {
    await removeTenantDomain(baseTenant(), { ...env, dryRun: true });

    expect(deleteVercelProjectDomainMock).not.toHaveBeenCalled();
  });
});
