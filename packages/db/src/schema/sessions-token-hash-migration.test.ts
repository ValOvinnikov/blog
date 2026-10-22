import * as schema from '@blog/db/schema';
import { sessions, users } from '@blog/db/schema/auth';
import { insertTestUser } from '@blog/db/testing/fixtures';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

const DELETE_SESSIONS_MIGRATION = '0054_delete_unhashed_sessions.sql';

describe('0054_delete_unhashed_sessions (sessions stored before hashing end)', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(() => {
    db = drizzle(new PGlite(), { schema });
  });

  it(
    'removes every existing session and keeps its user',
    async () => {
      for (const file of listMigrationFiles()) {
        if (file >= DELETE_SESSIONS_MIGRATION) break;
        await applyMigrationFile(db, file);
      }

      const user = await insertTestUser(db);
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
