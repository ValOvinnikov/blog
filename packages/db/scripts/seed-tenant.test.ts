import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import {
  MOCK_TENANT_VALUES,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { resolveOrCreateTenant } from './seed-tenant';

faker.seed(5809);

const { getTenantByDomainMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
}));
const {
  createTenantMock,
  getTenantIdBySanityProjectIdMock,
  getTenantByIdMock,
} = vi.hoisted(() => ({
  createTenantMock: vi.fn(),
  getTenantIdBySanityProjectIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenant-domains', () => ({
  getTenantByDomain: getTenantByDomainMock,
  addTenantDomain: vi.fn(),
}));
vi.mock('@blog/db/queries/tenants', () => ({
  createTenant: createTenantMock,
  getTenantById: getTenantByIdMock,
  getTenantIdBySanityProjectId: getTenantIdBySanityProjectIdMock,
  setTenantSanityToken: vi.fn(),
}));

const MOCK_OTHER_SANITY_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_ARCHIVED_AT = faker.date.recent();

const MOCK_SEED_ARGS = {
  ...MOCK_TENANT_VALUES,
  ownerEmail: faker.internet.email(),
  status: TENANT_STATUS.ACTIVE,
  extraDomains: [],
};

function mockSeededTenant(overrides: Parameters<typeof mockTenant>[0] = {}) {
  return mockTenant({
    primaryDomain: MOCK_SEED_ARGS.primaryDomain,
    sanityProjectId: MOCK_SEED_ARGS.sanityProjectId,
    ...overrides,
  });
}

describe(resolveOrCreateTenant, () => {
  it('creates a new tenant when no row exists for the domain', async () => {
    const created = mockSeededTenant();
    createTenantMock.mockResolvedValue({ ok: true, data: created });

    const result = await resolveOrCreateTenant(MOCK_SEED_ARGS);

    expect(createTenantMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe(created.id);
  });

  it('reuses the existing tenant for the domain instead of creating a duplicate', async () => {
    const existing = mockSeededTenant();
    getTenantByDomainMock.mockResolvedValue(existing);

    const result = await resolveOrCreateTenant(MOCK_SEED_ARGS);

    expect(createTenantMock).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });

  it('reuses the domain-matched tenant when it has no Sanity project id yet', async () => {
    const existing = mockSeededTenant({ sanityProjectId: null });
    getTenantByDomainMock.mockResolvedValue(existing);

    const result = await resolveOrCreateTenant(MOCK_SEED_ARGS);

    expect(createTenantMock).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });

  it('rejects when the domain-matched tenant holds a different Sanity project id', async () => {
    const existing = mockSeededTenant({
      sanityProjectId: MOCK_OTHER_SANITY_PROJECT_ID,
    });
    getTenantByDomainMock.mockResolvedValue(existing);

    await expect(resolveOrCreateTenant(MOCK_SEED_ARGS)).rejects.toThrow(
      `seed-tenant: domain "${MOCK_SEED_ARGS.primaryDomain}" belongs to tenant "${existing.id}", which holds Sanity project "${MOCK_OTHER_SANITY_PROJECT_ID}", not "${MOCK_SEED_ARGS.sanityProjectId}".`,
    );
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(getTenantIdBySanityProjectIdMock).not.toHaveBeenCalled();
  });

  it('throws when createTenant fails', async () => {
    createTenantMock.mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_INVALID_DOMAIN,
    });

    await expect(resolveOrCreateTenant(MOCK_SEED_ARGS)).rejects.toThrow(
      `seed-tenant: createTenant failed (${ERROR_CODE.DB_INVALID_DOMAIN}).`,
    );
  });

  it('resumes a tenant that was created but never got its domain row', async () => {
    const existing = mockSeededTenant();
    getTenantIdBySanityProjectIdMock.mockResolvedValue(existing.id);
    getTenantByIdMock.mockResolvedValue(existing);

    const result = await resolveOrCreateTenant(MOCK_SEED_ARGS);

    expect(getTenantByIdMock).toHaveBeenCalledWith(existing.id, {
      includeArchived: true,
    });
    expect(createTenantMock).not.toHaveBeenCalled();
    expect(result.id).toBe(existing.id);
  });

  it('rejects when the Sanity project id belongs to an archived tenant', async () => {
    const archived = mockSeededTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });
    getTenantIdBySanityProjectIdMock.mockResolvedValue(archived.id);
    getTenantByIdMock.mockResolvedValue(archived);

    await expect(resolveOrCreateTenant(MOCK_SEED_ARGS)).rejects.toThrow(
      `seed-tenant: Sanity project id "${MOCK_SEED_ARGS.sanityProjectId}" is already held by archived tenant "${archived.id}".`,
    );
    expect(createTenantMock).not.toHaveBeenCalled();
  });

  it('rejects when the Sanity project id resolves to a missing tenant row', async () => {
    const missingId = faker.string.uuid();
    getTenantIdBySanityProjectIdMock.mockResolvedValue(missingId);
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(resolveOrCreateTenant(MOCK_SEED_ARGS)).rejects.toThrow(
      `seed-tenant: Sanity project id "${MOCK_SEED_ARGS.sanityProjectId}" resolved to tenant id "${missingId}", but that tenant no longer exists.`,
    );
    expect(createTenantMock).not.toHaveBeenCalled();
  });
});
