import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';

import {
  createTenantStudio,
  studioDomainForSlug,
  type TCreateStudioVercelProjectDeps,
} from './create-studio-vercel-project';

const {
  setTenantStudioVercelProjectMock,
  createVercelProjectMock,
  listVercelProjectDomainsMock,
  addVercelProjectDomainMock,
} = vi.hoisted(() => ({
  setTenantStudioVercelProjectMock: vi.fn(),
  createVercelProjectMock: vi.fn(),
  listVercelProjectDomainsMock: vi.fn(),
  addVercelProjectDomainMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  setTenantStudioVercelProject: setTenantStudioVercelProjectMock,
}));

vi.mock('../lib/vercel-client', () => ({
  createVercelProject: createVercelProjectMock,
  listVercelProjectDomains: listVercelProjectDomainsMock,
  addVercelProjectDomain: addVercelProjectDomainMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'mgmt-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'v-token',
  vercelOrgId: 'org_1',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  vercelCliVersion: '48.0.0',
  adminAppBaseUrl: 'https://admin.example.com',
  callbackSecret: 'shh',
  platformDomain: 'example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj123',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'PROVISIONING',
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  setTenantStudioVercelProjectMock.mockReset();
  createVercelProjectMock.mockReset();
  listVercelProjectDomainsMock.mockReset();
  addVercelProjectDomainMock.mockReset();
  listVercelProjectDomainsMock.mockResolvedValue([]);
});

describe(studioDomainForSlug, () => {
  it('builds the studio-<slug>.<platformDomain> hostname', () => {
    expect(studioDomainForSlug('acme', 'example.com')).toBe(
      'studio-acme.example.com',
    );
  });

  it('honors a different platform domain', () => {
    expect(studioDomainForSlug('acme', 'example.com')).toBe(
      'studio-acme.example.com',
    );
  });
});

describe(createTenantStudio, () => {
  it('throws when the Sanity project has not been created yet', async () => {
    const tenant = baseTenant({ sanityProjectId: null, sanityDataset: null });
    const exec = vi.fn();

    await expect(createTenantStudio(tenant, env, { exec })).rejects.toThrow(
      /has no Sanity project yet/,
    );
    expect(exec).not.toHaveBeenCalled();
  });

  it('creates a new Vercel project rooted at apps/cms and persists its id when none exists yet', async () => {
    const tenant = baseTenant();
    createVercelProjectMock.mockResolvedValue({
      id: 'prj_studio_1',
      name: 'studio-acme',
    });
    const exec = vi.fn();
    const deps: TCreateStudioVercelProjectDeps = { exec };

    const result = await createTenantStudio(tenant, env, deps);

    expect(createVercelProjectMock).toHaveBeenCalledWith({
      token: 'v-token',
      teamId: undefined,
      name: 'studio-acme',
      rootDirectory: 'apps/cms',
    });
    expect(setTenantStudioVercelProjectMock).toHaveBeenCalledWith(
      'tenant-1',
      'prj_studio_1',
    );
    expect(result).toEqual({ studioVercelProjectId: 'prj_studio_1' });
  });

  it('reuses the existing project id and skips creation when already set', async () => {
    const tenant = baseTenant({ studioVercelProjectId: 'prj_existing' });
    const exec = vi.fn();

    const result = await createTenantStudio(tenant, env, { exec });

    expect(createVercelProjectMock).not.toHaveBeenCalled();
    expect(setTenantStudioVercelProjectMock).not.toHaveBeenCalled();
    expect(result).toEqual({ studioVercelProjectId: 'prj_existing' });
  });

  it('adds the studio domain only when not already registered', async () => {
    const tenant = baseTenant({ studioVercelProjectId: 'prj_existing' });
    listVercelProjectDomainsMock.mockResolvedValue([
      { name: 'studio-acme.example.com' },
    ]);
    const exec = vi.fn();

    await createTenantStudio(tenant, env, { exec });

    expect(addVercelProjectDomainMock).not.toHaveBeenCalled();
  });

  it('runs vercel pull, build, and deploy in order against the resolved project', async () => {
    const tenant = baseTenant({ studioVercelProjectId: 'prj_existing' });
    const exec = vi.fn();

    await createTenantStudio(tenant, env, { exec });

    expect(exec).toHaveBeenCalledTimes(3);
    const commands = (exec.mock.calls as Array<[string, string[]]>).map(
      ([, args]) => args[2],
    );
    expect(commands).toEqual(['pull', 'build', 'deploy']);

    const [, , firstCallOptions] = exec.mock.calls[0] as [
      string,
      string[],
      { env: NodeJS.ProcessEnv },
    ];
    expect(firstCallOptions.env['VERCEL_PROJECT_ID']).toBe('prj_existing');
    expect(firstCallOptions.env['SANITY_STUDIO_PROJECT_ID']).toBe('proj123');
    expect(firstCallOptions.env['SANITY_STUDIO_DATASET']).toBe('production');
  });
});
