import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
} from '@shinefold/db/testing/sanity-management-client/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { setTenantSanityProject } from './set-tenant-sanity-project';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, {
  sanityProjectId: null,
  sanityDataset: null,
});
useFrozenClock();

const MOCK_SANITY_PROJECT = {
  sanityProjectId: MOCK_SANITY_PROJECT_ID,
  sanityDataset: MOCK_SANITY_DATASET,
};

describe(setTenantSanityProject, () => {
  it('sets the Sanity project id and dataset, leaving every other column untouched', async () => {
    await setTenantSanityProject(tenant().id, MOCK_SANITY_PROJECT);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([
      { ...tenant(), ...MOCK_SANITY_PROJECT, updatedAt: MOCK_NOW },
    ]);
  });

  it('updates no row for a tenant id that does not exist', async () => {
    await setTenantSanityProject(MOCK_MISSING_TENANT_ID, MOCK_SANITY_PROJECT);

    const rows = await db().select().from(schema.tenants);
    expect(rows).toEqual([tenant()]);
  });
});
