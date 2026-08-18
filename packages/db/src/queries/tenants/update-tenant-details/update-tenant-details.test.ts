import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  updateTenantDetails,
  type TUpdateTenantDetailsInput,
} from './update-tenant-details';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const validInput: TUpdateTenantDetailsInput = {
  name: 'Acme Updated',
  slug: 'acme',
  primaryDomain: 'acme.example.com',
  plan: TENANT_PLAN.FREE,
  locale: 'en',
};

async function insertTenantWithDomain(overrides?: {
  slug?: string;
  domain?: string;
  sanityProjectId?: string;
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
}): Promise<string> {
  const slug = overrides?.slug ?? 'acme';
  const domain = overrides?.domain ?? 'acme.example.com';

  const [tenant] = await db
    .insert(tenants)
    .values({
      slug,
      name: 'Acme',
      primaryDomain: domain,
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      sanityProjectId: overrides?.sanityProjectId,
      provisioningStatus: overrides?.provisioningStatus,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  await db.insert(tenantDomains).values({ tenantId: tenant.id, domain });

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
});

describe(updateTenantDetails, () => {
  it('updates the editable fields and returns the updated row', async () => {
    const tenantId = await insertTenantWithDomain();

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
      locale: 'fr',
      plan: TENANT_PLAN.GROWTH,
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant).toMatchObject({
      name: 'New Name',
      locale: 'fr',
      plan: TENANT_PLAN.GROWTH,
    });
  });

  it('updates primaryDomain and moves the matching tenant_domains row with it', async () => {
    const tenantId = await insertTenantWithDomain();

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      primaryDomain: 'acme-new.example.com',
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant.primaryDomain).toBe('acme-new.example.com');

    const domainRows = await db
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, tenantId));

    expect(domainRows).toHaveLength(1);
    expect(domainRows[0]).toMatchObject({ domain: 'acme-new.example.com' });
  });

  it('returns a handled slug-taken outcome instead of throwing on a slug collision', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'acme',
      primaryDomain: 'globex.example.com',
    });

    expect(result).toEqual({ outcome: 'slug-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, secondTenantId));
    expect(row?.slug).toBe('globex');
  });

  it('leaves provisioning artifact columns untouched by an update', async () => {
    const tenantId = await insertTenantWithDomain({
      sanityProjectId: 'abc123',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    if (result.outcome !== 'updated') {
      throw new Error(`expected 'updated', got '${result.outcome}'`);
    }
    expect(result.tenant).toMatchObject({
      sanityProjectId: 'abc123',
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('throws for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(updateTenantDetails(missingId, validInput)).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${missingId}".`,
    );
  });
});
