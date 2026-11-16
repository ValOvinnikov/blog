import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { tenants } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantWebhookCreatedAt } from './set-tenant-webhook-created-at';

vi.mock('@shinefold/db/client');

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
