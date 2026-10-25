import type * as schema from '@blog/db/schema';
import { sessions, users } from '@blog/db/schema/auth';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

const DELETE_SESSIONS_MIGRATION = '0054_delete_unhashed_sessions.sql';

describe('0054_delete_unhashed_sessions (sessions stored before hashing end)', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'removes every existing session and keeps its user',
    async () => {
      for (const file of listMigrationFiles()) {
        if (file >= DELETE_SESSIONS_MIGRATION) break;
        await applyMigrationFile(db, file);
      }

      const user = { id: faker.string.uuid() };
      await db.execute(sql`insert into "users" ("id") values (${user.id})`);
      await db.insert(sessions).values(
        Array.from({ length: 2 }, () => ({
          sessionToken: faker.string.uuid(),
          userId: user.id,
          expires: faker.date.future(),
        })),
      );

      await applyMigrationFile(db, DELETE_SESSIONS_MIGRATION);

      expect(await db.select().from(sessions)).toEqual([]);
      expect(await db.select({ id: users.id }).from(users)).toEqual([
        { id: user.id },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
