import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';
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
  provisioningSteps?: TTenantProvisioningSteps;
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
      provisioningSteps: overrides?.provisioningSteps,
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

  it('returns a handled domain-taken outcome instead of throwing on a domain collision', async () => {
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
      slug: 'globex',
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'domain-taken' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, secondTenantId));
    expect(row).toMatchObject({
      name: 'Acme',
      slug: 'globex',
      primaryDomain: 'globex.example.com',
      plan: TENANT_PLAN.FREE,
      locale: 'en',
    });

    const domainRows = await db
      .select()
      .from(tenantDomains)
      .where(eq(tenantDomains.tenantId, secondTenantId));
    expect(domainRows).toHaveLength(1);
    expect(domainRows[0]).toMatchObject({ domain: 'globex.example.com' });
  });

  it("still updates when the domain is unchanged and only the tenant's own tenant_domains row holds it", async () => {
    const tenantId = await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name', primaryDomain: 'acme.example.com' },
    });
  });

  it('returns provisioning-started over domain-taken when both apply', async () => {
    await insertTenantWithDomain({
      slug: 'acme',
      domain: 'acme.example.com',
    });
    const secondTenantId = await insertTenantWithDomain({
      slug: 'globex',
      domain: 'globex.example.com',
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(secondTenantId, {
      ...validInput,
      slug: 'globex',
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });
  });

  it('returns slug-taken over domain-taken when both apply', async () => {
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
      primaryDomain: 'acme.example.com',
    });

    expect(result).toEqual({ outcome: 'slug-taken' });
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

  it('refuses with provisioning-started and leaves the row unchanged when a step is RUNNING', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toEqual({ outcome: 'provisioning-started' });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.name).toBe('Acme');
  });

  it('refuses with provisioning-started when a step is DONE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, validInput);

    expect(result).toEqual({ outcome: 'provisioning-started' });
  });

  it('still updates when every step is IDLE', async () => {
    const tenantId = await insertTenantWithDomain({
      provisioningSteps: {
        SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        DEPLOY_STUDIO: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
        CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      },
    });

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name' },
    });
  });

  it('still updates when provisioningSteps is null', async () => {
    const tenantId = await insertTenantWithDomain();

    const result = await updateTenantDetails(tenantId, {
      ...validInput,
      name: 'New Name',
    });

    expect(result).toMatchObject({
      outcome: 'updated',
      tenant: { name: 'New Name' },
    });
  });

  it('throws for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(updateTenantDetails(missingId, validInput)).rejects.toThrow(
      `updateTenantDetails: no tenant found for id "${missingId}".`,
    );
  });
});
