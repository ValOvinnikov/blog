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
import { asc, sql } from 'drizzle-orm';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

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

      await db.execute(
        sql.raw(`
        insert into "subscribers"
          ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token")
        values
          ('sub-1', '${tenant.id}', 'reader-one@example.com', 'confirm-1', 'unsub-1'),
          ('sub-2', '${tenant.id}', 'reader-two@example.com', 'confirm-2', 'unsub-2')
      `),
      );

      await applyMigrationFile(db, HASH_MIGRATION);

      const rows = await db
        .select({
          confirmationTokenHash: subscribers.confirmationTokenHash,
          unsubscribeTokenHash: subscribers.unsubscribeTokenHash,
        })
        .from(subscribers)
        .orderBy(asc(subscribers.id));

      expect(rows).toEqual([
        {
          confirmationTokenHash: sha256Hex('confirm-1'),
          unsubscribeTokenHash: sha256Hex('unsub-1'),
        },
        {
          confirmationTokenHash: sha256Hex('confirm-2'),
          unsubscribeTokenHash: sha256Hex('unsub-2'),
        },
      ]);
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
          email: `${crypto.randomUUID()}@example.com`,
        })
        .returning();
      if (!first) throw new Error('failed to seed a subscriber row');

      await expect(
        db.insert(subscribers).values({
          tenantId: tenant.id,
          email: `${crypto.randomUUID()}@example.com`,
          unsubscribeTokenHash: first.unsubscribeTokenHash,
        }),
      ).rejects.toThrow();
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
