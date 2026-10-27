import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  replayMigrationsAround,
} from '@blog/db/testing/migration-files';

import { tenants } from './tenants';

const LOCALE_MIGRATION = '0032_famous_hawkeye.sql';
const MOCK_UNSUPPORTED_LOCALE = 'en-US';
const LOCALES_BY_STORED_VALUE = [
  { stored: LOCALE_ISO_CODES.EN, normalized: LOCALE_ISO_CODES.EN },
  { stored: ` ${LOCALE_ISO_CODES.FR} `, normalized: LOCALE_ISO_CODES.FR },
  { stored: LOCALE_ISO_CODES.DE, normalized: LOCALE_ISO_CODES.DE },
];

function causeMessage(error: unknown): string {
  if (error instanceof Error && error.cause instanceof Error) {
    return error.cause.message;
  }
  throw new Error('expected an error carrying an Error cause');
}

describe(`${LOCALE_MIGRATION} (tenants locale codes)`, () => {
  it(
    'normalizes existing locales to supported codes with no additional locales',
    async () => {
      const db = await createEmptyTestDb();
      const tenantIds: string[] = [];

      await replayMigrationsAround(db, LOCALE_MIGRATION, async () => {
        for (const { stored } of LOCALES_BY_STORED_VALUE) {
          tenantIds.push((await insertReplayTenant(db, stored)).id);
        }
      });

      const rows = await db
        .select({
          id: tenants.id,
          locale: tenants.locale,
          additionalLocales: tenants.additionalLocales,
        })
        .from(tenants);
      expect(tenantIds.map((id) => rows.find((row) => row.id === id))).toEqual(
        tenantIds.map((id, index) => ({
          id,
          locale: LOCALES_BY_STORED_VALUE[index]?.normalized,
          additionalLocales: [],
        })),
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'stops with the unsupported values named when a locale does not map',
    async () => {
      const db = await createEmptyTestDb();

      const failure = await replayMigrationsAround(
        db,
        LOCALE_MIGRATION,
        async () => {
          await insertReplayTenant(db, LOCALE_ISO_CODES.EN);
          await insertReplayTenant(db, MOCK_UNSUPPORTED_LOCALE);
        },
      ).then(
        () => undefined,
        (error: unknown) => error,
      );

      expect(causeMessage(failure)).toContain(
        MOCK_UNSUPPORTED_LOCALE.toUpperCase(),
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
