import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sql } from 'drizzle-orm';

import { tenants } from './tenants';

const LOCALE_MIGRATION = '0032_famous_hawkeye.sql';

async function migrateWithTenantLocales(locales: string[]) {
  const db = await createEmptyTestDb();
  const migrationFiles = listMigrationFiles();

  for (const file of migrationFiles.filter((f) => f < LOCALE_MIGRATION)) {
    await applyMigrationFile(db, file);
  }

  for (const [index, locale] of locales.entries()) {
    await db.execute(
      sql`insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values (${`Tenant ${index}`}, ${`t${index}.example.com`}, ${locale}, 'FREE', 'ACTIVE')`,
    );
  }

  async function run() {
    for (const file of migrationFiles.filter((f) => f >= LOCALE_MIGRATION)) {
      await applyMigrationFile(db, file);
    }
  }

  return { db, run };
}

describe('0032_famous_hawkeye (tenants locale codes)', () => {
  it(
    'normalizes existing locales to supported codes with no additional locales',
    async () => {
      const { db, run } = await migrateWithTenantLocales([
        'en',
        ' fr ',
        LOCALE_ISO_CODES.DE,
      ]);

      await run();

      const rows = await db
        .select({
          locale: tenants.locale,
          additionalLocales: tenants.additionalLocales,
        })
        .from(tenants)
        .orderBy(tenants.primaryDomain);

      expect(rows).toEqual([
        { locale: LOCALE_ISO_CODES.EN, additionalLocales: [] },
        { locale: LOCALE_ISO_CODES.FR, additionalLocales: [] },
        { locale: LOCALE_ISO_CODES.DE, additionalLocales: [] },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'stops with the unsupported values named when a locale does not map',
    async () => {
      const { run } = await migrateWithTenantLocales(['en', 'en-US']);

      await expect(run()).rejects.toMatchObject({
        cause: { message: expect.stringContaining('EN-US') },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
