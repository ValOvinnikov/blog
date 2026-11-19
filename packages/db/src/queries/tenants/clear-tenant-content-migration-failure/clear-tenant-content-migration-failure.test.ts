import { faker } from '@faker-js/faker';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { clearTenantContentMigrationFailure } from './clear-tenant-content-migration-failure';

vi.mock('@shinefold/db/client');

faker.seed(6141);

const MOCK_FAILED_AT = faker.date.past({ refDate: MOCK_NOW });

const db = useQueryTestDb();
useFrozenClock();
const tenant = useTestTenant(db, {
  contentMigrationFailedAt: MOCK_FAILED_AT,
});

describe(clearTenantContentMigrationFailure, () => {
  it('clears a recorded content migration failure, leaving every other column untouched', async () => {
    await clearTenantContentMigrationFailure(tenant().id);

    const row = await readTestTenant(db(), tenant().id);
    expect(row).toEqual({
      ...tenant(),
      contentMigrationFailedAt: null,
      updatedAt: MOCK_NOW,
    });
  });
});
