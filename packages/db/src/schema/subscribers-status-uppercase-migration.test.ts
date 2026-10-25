import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import type * as schema from '@blog/db/schema';
import { subscribers } from '@blog/db/schema/subscribers';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  insertReplayTenant,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

function byEmail(a: { email: string }, b: { email: string }): number {
  return a.email < b.email ? -1 : 1;
}

const UPPERCASE_MIGRATION = '0059_uppercase_subscriber_status.sql';

describe('0059_uppercase_subscriber_status (subscriber statuses stored uppercase)', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    for (const file of listMigrationFiles()) {
      if (file >= UPPERCASE_MIGRATION) break;
      await applyMigrationFile(db, file);
    }
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'keeps every existing status, stored uppercase',
    async () => {
      const tenant = await insertReplayTenant(db);
      const seeds = Object.values(SUBSCRIBER_STATUS).map((status) => ({
        email: faker.internet.email(),
        status,
      }));
      await db
        .insert(subscribers)
        .values(seeds.map((seed) => ({ ...seed, tenantId: tenant.id })));
      await db.execute(
        sql`update "subscribers" set "status" = lower("status")`,
      );

      await applyMigrationFile(db, UPPERCASE_MIGRATION);

      const rows = await db
        .select({ email: subscribers.email, status: subscribers.status })
        .from(subscribers);
      expect(rows.sort(byEmail)).toEqual([...seeds].sort(byEmail));
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'stores a new subscriber as pending, uppercase',
    async () => {
      await applyMigrationFile(db, UPPERCASE_MIGRATION);
      const tenant = await insertReplayTenant(db);
      const email = faker.internet.email();

      await db.insert(subscribers).values({ tenantId: tenant.id, email });

      const [row] = await db
        .select({ status: subscribers.status })
        .from(subscribers);
      expect(row?.status).toBe(SUBSCRIBER_STATUS.PENDING);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
