import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { setTenantWebhookCreatedAt } from './set-tenant-webhook-created-at';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_WEBHOOK_CREATED_AT = faker.date.past({ refDate: MOCK_NOW });

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantWebhookCreatedAt, () => {
  it('records when the webhook was created, leaving every other column untouched', async () => {
    const tenant = await insertTestTenant(db());

    await setTenantWebhookCreatedAt(tenant.id, MOCK_WEBHOOK_CREATED_AT);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row).toEqual({
      ...tenant,
      webhookCreatedAt: MOCK_WEBHOOK_CREATED_AT,
      updatedAt: MOCK_NOW,
    });
  });
});
