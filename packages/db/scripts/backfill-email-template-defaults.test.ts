import type { TTenant } from '@blog/db/schema/tenants';

import { backfillEmailTemplateDefaults } from './backfill-email-template-defaults';

const { listTenantsMock, seedEmailTemplateDefaultsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  seedEmailTemplateDefaultsMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listTenants: listTenantsMock,
}));
vi.mock('@blog/db/queries/email-templates', () => ({
  seedEmailTemplateDefaults: seedEmailTemplateDefaultsMock,
}));

function tenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: 'proj-acme',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    studioVercelProjectId: null,
    seededAt: new Date('2026-01-01T00:00:00.000Z'),
    webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe(backfillEmailTemplateDefaults, () => {
  it('seeds every active tenant when not a dry run', async () => {
    listTenantsMock.mockResolvedValue([
      tenant({ id: 'tenant-1' }),
      tenant({ id: 'tenant-2' }),
    ]);

    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(2);
    expect(seedEmailTemplateDefaultsMock).toHaveBeenCalledTimes(2);
    expect(seedEmailTemplateDefaultsMock).toHaveBeenCalledWith('tenant-1');
    expect(seedEmailTemplateDefaultsMock).toHaveBeenCalledWith('tenant-2');
  });

  it('reports tenants without writing anything on a dry run', async () => {
    listTenantsMock.mockResolvedValue([tenant({ id: 'tenant-1' })]);

    const count = await backfillEmailTemplateDefaults(true);

    expect(count).toBe(1);
    expect(seedEmailTemplateDefaultsMock).not.toHaveBeenCalled();
  });

  it('returns 0 and writes nothing when there are no tenants', async () => {
    listTenantsMock.mockResolvedValue([]);

    const count = await backfillEmailTemplateDefaults(false);

    expect(count).toBe(0);
    expect(seedEmailTemplateDefaultsMock).not.toHaveBeenCalled();
  });
});
