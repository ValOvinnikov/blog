import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplayLegacyTenant,
  insertReplayUser,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

faker.seed(6023);

const BACKFILL_MIGRATION = '0008_silly_xorn.sql';
const MOCK_TENANT_SLUG = faker.lorem.slug();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_SUBSCRIBER_ID = faker.string.uuid();
const MOCK_SUBSCRIBER_EMAIL = faker.internet.email();
const MOCK_CONFIRMATION_TOKEN = faker.string.uuid();

describe(`${BACKFILL_MIGRATION} (bookmarks/subscribers tenant_id backfill)`, () => {
  it(
    'backfills pre-existing bookmark and subscriber rows to the sole existing tenant',
    async () => {
      const db = await createEmptyTestDb();
      await applyMigrationsBefore(db, BACKFILL_MIGRATION);
      const user = await insertReplayUser(db);
      const tenant = await insertReplayLegacyTenant(db, MOCK_TENANT_SLUG);
      await db.execute(
        sql`insert into "bookmarks" ("user_id", "post_id") values (${user.id}, ${MOCK_POST_ID})`,
      );
      await db.execute(
        sql`insert into "subscribers" ("id", "email", "confirmation_token") values (${MOCK_SUBSCRIBER_ID}, ${MOCK_SUBSCRIBER_EMAIL}, ${MOCK_CONFIRMATION_TOKEN})`,
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const bookmarkRows = await db.execute<{ tenant_id: string }>(
        sql`select "tenant_id" from "bookmarks"`,
      );
      const subscriberRows = await db.execute<{ tenant_id: string }>(
        sql`select "tenant_id" from "subscribers"`,
      );
      expect(bookmarkRows.rows).toEqual([{ tenant_id: tenant.id }]);
      expect(subscriberRows.rows).toEqual([{ tenant_id: tenant.id }]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
