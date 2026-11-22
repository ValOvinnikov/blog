import { faker } from '@faker-js/faker';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { setTenantWebhookCreatedAt } from './set-tenant-webhook-created-at';

vi.mock('@shinefold/db/client');

faker.seed(6020);

const MOCK_WEBHOOK_CREATED_AT = faker.date.past({ refDate: MOCK_NOW });

const db = useQueryTestDb();
useFrozenClock();
const tenant = useTestTenant(db);

describe(setTenantWebhookCreatedAt, () => {
  it('records when the webhook was created, leaving every other column untouched', async () => {
    await setTenantWebhookCreatedAt(tenant().id, MOCK_WEBHOOK_CREATED_AT);

    const row = await readTestTenant(db(), tenant().id);
    expect(row).toEqual({
      ...tenant(),
      webhookCreatedAt: MOCK_WEBHOOK_CREATED_AT,
      updatedAt: MOCK_NOW,
    });
  });
});
