import type * as schema from '@blog/db/schema';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplaySubscriber,
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

faker.seed(6023);

const BACKFILL_MIGRATION = '0024_faithful_kree.sql';
const SEEDED_SUBSCRIBER_COUNT = 3;
const MOCK_UNSUBSCRIBE_TOKEN = faker.string.uuid();

describe(`${BACKFILL_MIGRATION} (subscribers unsubscribe_token backfill)`, () => {
  let db: PgliteDatabase<typeof schema>;
  let tenant: Awaited<ReturnType<typeof insertReplayTenant>>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    await applyMigrationsBefore(db, BACKFILL_MIGRATION);
    tenant = await insertReplayTenant(db);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'backfills every pre-existing subscriber with a distinct unsubscribe_token',
    async () => {
      for (let count = 0; count < SEEDED_SUBSCRIBER_COUNT; count += 1) {
        await insertReplaySubscriber(db, { tenantId: tenant.id });
      }

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const { rows } = await db.execute<{ unsubscribe_token: string | null }>(
        sql`select "unsubscribe_token" from "subscribers"`,
      );
      const tokens = rows.map((row) => row.unsubscribe_token);
      expect(
        tokens.filter((token) => token !== null && token !== ''),
      ).toHaveLength(SEEDED_SUBSCRIBER_COUNT);
      expect(new Set(tokens).size).toBe(SEEDED_SUBSCRIBER_COUNT);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  describe('once backfilled', () => {
    beforeEach(async () => {
      await applyMigrationFile(db, BACKFILL_MIGRATION);
      await insertReplaySubscriber(db, {
        tenantId: tenant.id,
        unsubscribeToken: MOCK_UNSUBSCRIBE_TOKEN,
      });
    }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

    it(
      'rejects a subscriber without an unsubscribe_token',
      async () => {
        await expect(
          insertReplaySubscriber(db, {
            tenantId: tenant.id,
            unsubscribeToken: null,
          }),
        ).rejects.toThrow();
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );

    it(
      'rejects a duplicate unsubscribe_token',
      async () => {
        await expect(
          insertReplaySubscriber(db, {
            tenantId: tenant.id,
            unsubscribeToken: MOCK_UNSUBSCRIBE_TOKEN,
          }),
        ).rejects.toThrow();
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );
  });
});
