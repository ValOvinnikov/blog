import { sessions, users } from '@blog/db/schema/auth';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplayUser,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';

faker.seed(6023);

const DELETE_SESSIONS_MIGRATION = '0054_delete_unhashed_sessions.sql';

describe(`${DELETE_SESSIONS_MIGRATION} (sessions stored before hashing end)`, () => {
  it(
    'removes every existing session and keeps its user',
    async () => {
      const db = await createEmptyTestDb();
      await applyMigrationsBefore(db, DELETE_SESSIONS_MIGRATION);
      const user = await insertReplayUser(db);
      await db.insert(sessions).values(
        Array.from({ length: 2 }, () => ({
          sessionToken: faker.string.uuid(),
          userId: user.id,
          expires: faker.date.future(),
        })),
      );

      await applyMigrationFile(db, DELETE_SESSIONS_MIGRATION);

      expect(await db.select().from(sessions)).toEqual([]);
      expect(await db.select({ id: users.id }).from(users)).toEqual([user]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
