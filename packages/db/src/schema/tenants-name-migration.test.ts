import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  insertReplayLegacyTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  replayMigrationsAround,
} from '@blog/db/testing/migration-files';

import { tenants } from './tenants';

const BACKFILL_MIGRATION = '0009_quick_jazinda.sql';
const NAMES_BY_SLUG = {
  acme: 'Acme',
  'acme-corp': 'Acme Corp',
  foo_bar: 'Foo Bar',
};

describe(`${BACKFILL_MIGRATION} (tenants name backfill)`, () => {
  it(
    'backfills pre-existing tenant rows to a title-cased version of their slug',
    async () => {
      const db = await createEmptyTestDb();
      const namesByDomain: Record<string, string> = {};

      await replayMigrationsAround(db, BACKFILL_MIGRATION, async () => {
        for (const [slug, name] of Object.entries(NAMES_BY_SLUG)) {
          const { primaryDomain } = await insertReplayLegacyTenant(db, slug);
          namesByDomain[primaryDomain] = name;
        }
      });

      const rows = await db.select().from(tenants);
      expect(
        Object.fromEntries(rows.map((row) => [row.primaryDomain, row.name])),
      ).toEqual(namesByDomain);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
