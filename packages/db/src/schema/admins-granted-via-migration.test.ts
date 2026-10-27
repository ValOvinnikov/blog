import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplayUser,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sql } from 'drizzle-orm';

import { admins } from './admins';

const BACKFILL_MIGRATION = '0007_wide_silver_samurai.sql';

describe(`${BACKFILL_MIGRATION} (granted_via backfill)`, () => {
  it(
    'backfills a pre-existing admin row to BREAK_GLASS',
    async () => {
      const db = await createEmptyTestDb();
      await applyMigrationsBefore(db, BACKFILL_MIGRATION);
      const user = await insertReplayUser(db);
      await db.execute(
        sql`insert into "admins" ("user_id", "role") values (${user.id}, ${ADMIN_ROLE.SUPERADMIN})`,
      );

      await applyMigrationFile(db, BACKFILL_MIGRATION);

      const [row] = await db.select().from(admins);
      expect(row?.grantedVia).toBe(GRANTED_VIA.BREAK_GLASS);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
