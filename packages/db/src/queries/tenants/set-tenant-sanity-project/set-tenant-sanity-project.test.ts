import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantSanityProject } from './set-tenant-sanity-project';

vi.mock('@blog/db/client');

const MOCK_ACME_DOMAIN = 'acme.example.com';

const db = useQueryTestDb();

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: MOCK_ACME_DOMAIN,
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityProject, () => {
  let tenantId: string;

  beforeEach(async () => {
    tenantId = await insertDraftTenant();
  });

  it('sets the Sanity project id and dataset', async () => {
    await setTenantSanityProject(tenantId, {
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });
  });

  it('leaves every other column untouched', async () => {
    await setTenantSanityProject(tenantId, {
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      name: 'Acme',
      primaryDomain: MOCK_ACME_DOMAIN,
      seededAt: null,
    });
  });

  it('resolves without updating any row for a tenant id that does not exist', async () => {
    await expect(
      setTenantSanityProject('00000000-0000-0000-0000-000000000000', {
        sanityProjectId: 'abc123',
        sanityDataset: 'production',
      }),
    ).resolves.toBeUndefined();
  });
});
