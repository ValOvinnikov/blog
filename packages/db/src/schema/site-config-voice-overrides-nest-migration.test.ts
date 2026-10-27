import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type * as schema from '@blog/db/schema';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsBefore,
  insertReplayVoiceOverrides,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  readReplayVoiceOverrides,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

faker.seed(6023);

const NEST_MIGRATION = '0037_nest_voice_overrides_by_locale.sql';
const MOCK_GERMAN_HEADING = faker.lorem.words(2);
const MOCK_ENGLISH_HEADING = faker.lorem.words(2);
const MOCK_FRENCH_HEADING = faker.lorem.words(2);
const MOCK_RICH_VALUE = [
  {
    _type: 'block',
    _key: faker.string.alphanumeric(8),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: faker.string.alphanumeric(8),
        text: faker.lorem.sentence(),
      },
    ],
  },
];

describe(`${NEST_MIGRATION} (voiceOverrides nested under the default locale)`, () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    await applyMigrationsBefore(db, NEST_MIGRATION);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    "nests every tenant's overrides under its own default locale, losing nothing",
    async () => {
      const germanTenantId = await insertReplayVoiceOverrides(
        db,
        {
          notFoundHeading: MOCK_GERMAN_HEADING,
          blogListEmpty: MOCK_RICH_VALUE,
        },
        LOCALE_ISO_CODES.DE,
      );
      const englishTenantId = await insertReplayVoiceOverrides(
        db,
        { notFoundHeading: MOCK_ENGLISH_HEADING },
        LOCALE_ISO_CODES.EN,
      );

      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readReplayVoiceOverrides(db, germanTenantId)).toEqual({
        [LOCALE_ISO_CODES.DE]: {
          notFoundHeading: MOCK_GERMAN_HEADING,
          blogListEmpty: MOCK_RICH_VALUE,
        },
      });
      expect(await readReplayVoiceOverrides(db, englishTenantId)).toEqual({
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: MOCK_ENGLISH_HEADING },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves a tenant with no overrides as an empty map',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(db, {});

      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({});
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'does not nest a second time when re-applied',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(
        db,
        { notFoundHeading: MOCK_FRENCH_HEADING },
        LOCALE_ISO_CODES.FR,
      );

      await applyMigrationFile(db, NEST_MIGRATION);
      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
        [LOCALE_ISO_CODES.FR]: { notFoundHeading: MOCK_FRENCH_HEADING },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
