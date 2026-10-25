import type * as schema from '@blog/db/schema';
import { subscribers } from '@blog/db/schema/subscribers';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

const NO_TENANT_ERROR = 'failed to seed a tenant row';

const BACKFILL_MIGRATION = '0024_faithful_kree.sql';

describe('0024_faithful_kree (subscribers unsubscribe_token backfill)', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'backfills every pre-existing subscriber row with a distinct, non-null unsubscribe_token',
    async () => {
      const migrationFiles = listMigrationFiles();
      const priorMigrations = migrationFiles.filter(
        (file) => file < BACKFILL_MIGRATION,
      );

      for (const file of priorMigrations) {
        await applyMigrationFile(db, file);
      }

      const insertedTenant = await db.execute<{ id: string }>(
        sql.raw(
          `insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values ('${faker.string.alphanumeric(12)}', '${faker.internet.domainName()}', 'en', 'FREE', 'ACTIVE') returning "id"`,
        ),
      );
      const tenant = insertedTenant.rows[0];
      if (!tenant) throw new Error(NO_TENANT_ERROR);

      await db.execute(
        sql.raw(`
        insert into "subscribers"
          ("id", "tenant_id", "email", "confirmation_token")
        values
          ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}'),
          ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}'),
          ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}')
      `),
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const result = await db.execute<{ unsubscribe_token: string | null }>(
        sql.raw(`select "unsubscribe_token" from "subscribers" order by "id"`),
      );
      const tokens = result.rows.map((row) => row.unsubscribe_token);

      expect(tokens).toHaveLength(3);
      expect(
        tokens.every((token) => typeof token === 'string' && token.length > 0),
      ).toBe(true);
      expect(new Set(tokens).size).toBe(tokens.length);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'enforces NOT NULL and UNIQUE on unsubscribe_token once backfilled',
    async () => {
      for (const file of listMigrationFiles()) {
        if (file > BACKFILL_MIGRATION) break;
        await applyMigrationFile(db, file);
      }

      const insertedTenant = await db.execute<{ id: string }>(
        sql.raw(
          `insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values ('${faker.string.alphanumeric(12)}', '${faker.internet.domainName()}', 'en', 'FREE', 'ACTIVE') returning "id"`,
        ),
      );
      const tenant = insertedTenant.rows[0];
      if (!tenant) throw new Error(NO_TENANT_ERROR);
      const existingUnsubscribeToken = faker.string.uuid();
      await db.execute(
        sql.raw(
          `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}', '${existingUnsubscribeToken}')`,
        ),
      );

      await expect(
        db.execute(
          sql.raw(
            `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}', NULL)`,
          ),
        ),
      ).rejects.toThrow();

      await expect(
        db.execute(
          sql.raw(
            `insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token", "unsubscribe_token") values ('${faker.string.uuid()}', '${tenant.id}', '${faker.internet.email()}', '${faker.string.uuid()}', '${existingUnsubscribeToken}')`,
          ),
        ),
      ).rejects.toThrow();
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty subscribers table',
    async () => {
      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(subscribers);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
