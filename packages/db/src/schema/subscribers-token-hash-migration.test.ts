import * as schema from '@blog/db/schema';
import { subscribers } from '@blog/db/schema/subscribers';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sha256Hex } from '@blog/utils/hash';
import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : 1;
}

const HASH_MIGRATION = '0050_hash_subscriber_tokens.sql';

describe('0050_hash_subscriber_tokens (subscriber tokens hashed in place)', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(() => {
    db = drizzle(new PGlite(), { schema });
  });

  it(
    'replaces every stored token with its SHA-256 hash',
    async () => {
      for (const file of listMigrationFiles()) {
        if (file >= HASH_MIGRATION) break;
        await applyMigrationFile(db, file);
      }

      const tenant = await insertTestTenant(db);

      const seeds = Array.from({ length: 2 }, () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        confirmationToken: faker.string.uuid(),
        unsubscribeToken: faker.string.uuid(),
      }));
      const values = seeds
        .map(
          ({ id, email, confirmationToken, unsubscribeToken }) =>
            `('${id}', '${tenant.id}', '${email}', '${confirmationToken}', '${unsubscribeToken}')`,
        )
        .join(', ');
      await db.execute(
        sql.raw(
          `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ${values}`,
        ),
      );

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

  it(
    'keeps both hash columns unique once fully migrated',
    async () => {
      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const tenant = await insertTestTenant(db);
      const [first] = await db
        .insert(subscribers)
        .values({
          tenantId: tenant.id,
          email: `${faker.string.uuid()}@example.com`,
        })
        .returning();
      if (!first) throw new Error('failed to seed a subscriber row');

      await expect(
        db.insert(subscribers).values({
          tenantId: tenant.id,
          email: `${faker.string.uuid()}@example.com`,
          unsubscribeTokenHash: first.unsubscribeTokenHash,
        }),
      ).rejects.toThrow();
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
