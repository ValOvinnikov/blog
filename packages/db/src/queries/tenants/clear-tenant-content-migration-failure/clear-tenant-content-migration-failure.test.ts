import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { clearTenantContentMigrationFailure } from './clear-tenant-content-migration-failure';

vi.mock('@blog/db/client');

faker.seed(6141);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_FAILED_AT = faker.date.past({ refDate: MOCK_NOW });

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(clearTenantContentMigrationFailure, () => {
  it('clears a recorded content migration failure, leaving every other column untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      contentMigrationFailedAt: MOCK_FAILED_AT,
    });

    await clearTenantContentMigrationFailure(tenant.id);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row).toEqual({
      ...tenant,
      contentMigrationFailedAt: null,
      updatedAt: MOCK_NOW,
    });
  });
});
