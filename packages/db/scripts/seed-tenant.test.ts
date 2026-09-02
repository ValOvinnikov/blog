import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { resolveOrCreateTenant } from './seed-tenant';

const { getTenantByDomainMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
}));
const { createTenantMock } = vi.hoisted(() => ({
  createTenantMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenant-domains', () => ({
  getTenantByDomain: getTenantByDomainMock,
  addTenantDomain: vi.fn(),
}));
vi.mock('@blog/db/queries/tenants', () => ({
  createTenant: createTenantMock,
  setTenantSanityToken: vi.fn(),
}));

const args = {
  name: 'Acme',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'proj-acme',
  sanityDataset: 'production',
  locale: 'en',
  ownerEmail: 'owner@example.com',
  plan: TENANT_PLAN.FREE,
  status: TENANT_STATUS.ACTIVE,
  extraDomains: [] as string[],
};

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
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: null,
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  getTenantByDomainMock.mockReset();
  createTenantMock.mockReset();
});

describe(resolveOrCreateTenant, () => {
  it('creates a new tenant when no row exists for the domain', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    createTenantMock.mockResolvedValue({ ok: true, data: tenant() });

    const result = await resolveOrCreateTenant(args);

    expect(createTenantMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('tenant-1');
  });

  it('is idempotent: reuses the existing tenant for the domain instead of creating a duplicate', async () => {
    getTenantByDomainMock.mockResolvedValue(tenant());

    const result = await resolveOrCreateTenant(args);

    expect(createTenantMock).not.toHaveBeenCalled();
    expect(result.id).toBe('tenant-1');
  });

  it('throws when createTenant fails', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    createTenantMock.mockResolvedValue({
      ok: false,
      error: 'DB_INVALID_DOMAIN',
    });

    await expect(resolveOrCreateTenant(args)).rejects.toThrow(
      'seed-tenant: createTenant failed (DB_INVALID_DOMAIN).',
    );
  });
});
