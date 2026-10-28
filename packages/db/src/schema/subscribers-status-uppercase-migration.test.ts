import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import type * as schema from '@blog/db/schema';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

faker.seed(6023);

const UPPERCASE_MIGRATION = '0059_uppercase_subscriber_status.sql';

type TReplaySubscriber = { email: string; status: string };

function byEmail(a: TReplaySubscriber, b: TReplaySubscriber): number {
  return a.email < b.email ? -1 : 1;
}

async function insertSubscriber(
  db: PgliteDatabase<typeof schema>,
  tenantId: string,
  email: string,
  status = sql`default`,
): Promise<void> {
  await db.execute(
    sql`insert into "subscribers" ("id", "tenant_id", "email", "status", "confirmation_token_hash", "unsubscribe_token_hash") values (${faker.string.uuid()}, ${tenantId}, ${email}, ${status}, ${faker.string.uuid()}, ${faker.string.uuid()})`,
  );
}

describe(`${UPPERCASE_MIGRATION} (subscriber statuses stored uppercase)`, () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    await applyMigrationsBefore(db, UPPERCASE_MIGRATION);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'keeps every existing status, stored uppercase',
    async () => {
      const tenant = await insertReplayTenant(db);
      const seeds = Object.values(SUBSCRIBER_STATUS).map((status) => ({
        email: faker.internet.email(),
        status,
      }));
      for (const { email, status } of seeds) {
        await insertSubscriber(db, tenant.id, email, sql`lower(${status})`);
      }

      await applyMigrationFile(db, UPPERCASE_MIGRATION);

      const { rows } = await db.execute<TReplaySubscriber>(
        sql`select "email", "status" from "subscribers"`,
      );
      expect(rows.sort(byEmail)).toEqual([...seeds].sort(byEmail));
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'stores a new subscriber as pending, uppercase',
    async () => {
      await applyMigrationFile(db, UPPERCASE_MIGRATION);
      const tenant = await insertReplayTenant(db);

      await insertSubscriber(db, tenant.id, faker.internet.email());

      const { rows } = await db.execute<Pick<TReplaySubscriber, 'status'>>(
        sql`select "status" from "subscribers"`,
      );
      expect(rows).toEqual([{ status: SUBSCRIBER_STATUS.PENDING }]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
