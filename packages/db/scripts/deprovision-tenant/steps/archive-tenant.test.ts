import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { archiveTenantRow } from './archive-tenant';

const { archiveTenantMock } = vi.hoisted(() => ({
  archiveTenantMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  archiveTenant: archiveTenantMock,
}));

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: null,
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    deprovisionedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  archiveTenantMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: baseTenant() });
});

describe(archiveTenantRow, () => {
  it('archives the tenant row', async () => {
    await archiveTenantRow(baseTenant(), env);

    expect(archiveTenantMock).toHaveBeenCalledWith('tenant-1');
  });

  it('skips when already deprovisioned', async () => {
    await archiveTenantRow(baseTenant({ deprovisionedAt: new Date() }), env);

    expect(archiveTenantMock).not.toHaveBeenCalled();
  });

  it('does not write to the row in dry-run mode', async () => {
    await archiveTenantRow(baseTenant(), { ...env, dryRun: true });

    expect(archiveTenantMock).not.toHaveBeenCalled();
  });
});
