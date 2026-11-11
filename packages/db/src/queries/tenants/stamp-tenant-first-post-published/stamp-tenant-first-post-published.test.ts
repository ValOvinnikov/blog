import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { stampTenantFirstPostPublished } from './stamp-tenant-first-post-published';

vi.mock('@blog/db/client');

faker.seed(7154);

const MOCK_FIRST_POST_PUBLISHED_AT = faker.date.past({ refDate: MOCK_NOW });

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

async function readTenant() {
  const [row] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenant().id));
  return row;
}

describe(stampTenantFirstPostPublished, () => {
  it('records when the first post was published, leaving every other column untouched', async () => {
    await stampTenantFirstPostPublished(tenant().id);

    const row = await readTenant();
    expect(row).toEqual({
      ...tenant(),
      firstPostPublishedAt: MOCK_NOW,
      updatedAt: MOCK_NOW,
    });
  });

  it('keeps the first stamp on a later publish', async () => {
    await db()
      .update(schema.tenants)
      .set({ firstPostPublishedAt: MOCK_FIRST_POST_PUBLISHED_AT })
      .where(eq(schema.tenants.id, tenant().id));

    await stampTenantFirstPostPublished(tenant().id);

    const row = await readTenant();
    expect(row?.firstPostPublishedAt).toEqual(MOCK_FIRST_POST_PUBLISHED_AT);
  });
});
