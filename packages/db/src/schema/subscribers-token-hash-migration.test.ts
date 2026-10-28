import { subscribers } from '@blog/db/schema/subscribers';
import {
  createEmptyTestDb,
  createTestDb,
} from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplaySubscriber,
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { uniqueEmailColumns } from '@blog/db/utils/personal-data/personal-data';
import { sha256Hex } from '@blog/utils/hash';
import { faker } from '@faker-js/faker';

faker.seed(6023);

const HASH_MIGRATION = '0050_hash_subscriber_tokens.sql';
const SEEDED_SUBSCRIBER_COUNT = 2;

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : 1;
}

describe(`${HASH_MIGRATION} (subscriber tokens hashed in place)`, () => {
  it(
    'replaces every stored token with its SHA-256 hash',
    async () => {
      const db = await createEmptyTestDb();
      await applyMigrationsBefore(db, HASH_MIGRATION);
      const tenant = await insertReplayTenant(db);
      const seeds = [];
      for (let count = 0; count < SEEDED_SUBSCRIBER_COUNT; count += 1) {
        const unsubscribeToken = faker.string.uuid();
        const subscriber = await insertReplaySubscriber(db, {
          tenantId: tenant.id,
          unsubscribeToken,
        });
        seeds.push({ ...subscriber, unsubscribeToken });
      }

      await applyMigrationFile(db, HASH_MIGRATION);

      const rows = await db
        .select({
          id: subscribers.id,
          confirmationTokenHash: subscribers.confirmationTokenHash,
          unsubscribeTokenHash: subscribers.unsubscribeTokenHash,
        })
        .from(subscribers);
      expect(rows.sort(byId)).toEqual(
        seeds
          .map(({ id, confirmationToken, unsubscribeToken }) => ({
            id,
            confirmationTokenHash: sha256Hex(confirmationToken),
            unsubscribeTokenHash: sha256Hex(unsubscribeToken),
          }))
          .sort(byId),
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it('keeps the unsubscribe hash unique once fully migrated', async () => {
    const db = await createTestDb();
    const tenant = await insertReplayTenant(db);
    const [first] = await db
      .insert(subscribers)
      .values({
        tenantId: tenant.id,
        ...uniqueEmailColumns(faker.internet.email()),
      })
      .returning();
    if (!first) throw new Error('failed to seed a subscriber row');

    await expect(
      db.insert(subscribers).values({
        tenantId: tenant.id,
        ...uniqueEmailColumns(faker.internet.email()),
        unsubscribeTokenHash: first.unsubscribeTokenHash,
      }),
    ).rejects.toThrow();
  });
});
