import * as schema from '@shinefold/db/schema';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestTenantSuspension,
  useSuspensionAdmin,
} from '@shinefold/db/testing/tenant-suspensions/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { reopenTenantSuspension } from './reopen-tenant-suspension';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
const liftedBy = useSuspensionAdmin(db);

describe(reopenTenantSuspension, () => {
  it('clears who lifted the case and when', async () => {
    const { id } = await insertTestTenantSuspension(db(), tenant().id, {
      liftedAt: new Date(),
      liftedBy: liftedBy(),
    });

    await reopenTenantSuspension(id);

    const [row] = await db().select().from(schema.tenantSuspensions);
    expect(row).toMatchObject({ liftedAt: null, liftedBy: null });
  });
});
