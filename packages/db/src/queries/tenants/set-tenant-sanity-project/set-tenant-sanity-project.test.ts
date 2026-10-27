import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
} from '@blog/db/testing/sanity-management-client/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { setTenantSanityProject } from './set-tenant-sanity-project';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_SANITY_PROJECT = {
  sanityProjectId: MOCK_SANITY_PROJECT_ID,
  sanityDataset: MOCK_SANITY_DATASET,
};

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSanityProject, () => {
  let tenant: TTenant;

  beforeEach(async () => {
    tenant = await insertTestTenant(db(), {
      sanityProjectId: null,
      sanityDataset: null,
    });
  });

  it('sets the Sanity project id and dataset, leaving every other column untouched', async () => {
    await setTenantSanityProject(tenant.id, MOCK_SANITY_PROJECT);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([
      { ...tenant, ...MOCK_SANITY_PROJECT, updatedAt: MOCK_NOW },
    ]);
  });

  it('updates no row for a tenant id that does not exist', async () => {
    await setTenantSanityProject(MOCK_MISSING_TENANT_ID, MOCK_SANITY_PROJECT);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([tenant]);
  });
});
