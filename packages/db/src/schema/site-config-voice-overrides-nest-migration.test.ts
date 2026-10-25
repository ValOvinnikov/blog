import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { eq, sql } from 'drizzle-orm';

import { siteConfig } from './site-config';

const GERMAN_NOT_FOUND_HEADING = 'Nicht gefunden';
const ENGLISH_NOT_FOUND_HEADING = 'Lost the plot?';
const NEST_MIGRATION = '0037_nest_voice_overrides_by_locale.sql';

async function setUpDbBeforeNestMigration() {
  const db = await createEmptyTestDb();

  for (const file of listMigrationFiles().filter(
    (name) => name < NEST_MIGRATION,
  )) {
    await applyMigrationFile(db, file);
  }

  return db;
}

type TDb = Awaited<ReturnType<typeof setUpDbBeforeNestMigration>>;

async function seedTenantWithOverrides(
  db: TDb,
  locale: TLocaleIsoCode,
  voiceOverrides: Record<string, unknown>,
) {
  const { rows } = await db.execute<{ id: string }>(sql`
    INSERT INTO tenants (name, primary_domain, locale, plan, status)
    VALUES (
      ${`tenant-${locale}`}, ${`${locale}.example.com`}, ${locale},
      ${TENANT_PLAN.FREE}, ${TENANT_STATUS.ACTIVE}
    )
    RETURNING id
  `);
  const [tenant] = rows;
  if (!tenant) throw new Error('failed to seed a tenant row');

  await db.execute(sql`
    INSERT INTO site_config
      (tenant_id, preset, accent_hue, heading_font, body_font, radius_scale, density, voice_overrides)
    VALUES (
      ${tenant.id}, ${PRESET_ID.EDITORIAL}, 28, ${FONT_CHOICE.FRAUNCES}, ${FONT_CHOICE.INTER},
      ${RADIUS_SCALE.SM}, ${DENSITY.COMPACT}, ${JSON.stringify(voiceOverrides)}::jsonb
    )
  `);

  return tenant.id;
}

async function readVoiceOverrides(db: TDb, tenantId: string) {
  const [row] = await db
    .select({ voiceOverridesByLocale: siteConfig.voiceOverridesByLocale })
    .from(siteConfig)
    .where(eq(siteConfig.tenantId, tenantId));
  if (!row) throw new Error('expected a site_config row');
  return row.voiceOverridesByLocale;
}

const richValue = [
  {
    _type: 'block',
    _key: 'block-1',
    style: 'normal',
    children: [{ _type: 'span', _key: 'span-1', text: 'Nothing yet.' }],
  },
];

describe(`${NEST_MIGRATION} (voiceOverrides nested under the default locale)`, () => {
  it(
    "nests every tenant's overrides under its own default locale, losing nothing",
    async () => {
      const db = await setUpDbBeforeNestMigration();
      const germanTenant = await seedTenantWithOverrides(
        db,
        LOCALE_ISO_CODES.DE,
        { notFoundHeading: GERMAN_NOT_FOUND_HEADING, blogListEmpty: richValue },
      );
      const englishTenant = await seedTenantWithOverrides(
        db,
        LOCALE_ISO_CODES.EN,
        { notFoundHeading: ENGLISH_NOT_FOUND_HEADING },
      );

      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readVoiceOverrides(db, germanTenant)).toEqual({
        [LOCALE_ISO_CODES.DE]: {
          notFoundHeading: GERMAN_NOT_FOUND_HEADING,
          blogListEmpty: richValue,
        },
      });
      expect(await readVoiceOverrides(db, englishTenant)).toEqual({
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: ENGLISH_NOT_FOUND_HEADING },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves a tenant with no overrides as an empty map',
    async () => {
      const db = await setUpDbBeforeNestMigration();
      const tenantId = await seedTenantWithOverrides(
        db,
        LOCALE_ISO_CODES.EN,
        {},
      );

      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readVoiceOverrides(db, tenantId)).toEqual({});
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'does not nest a second time when re-applied',
    async () => {
      const db = await setUpDbBeforeNestMigration();
      const tenantId = await seedTenantWithOverrides(db, LOCALE_ISO_CODES.FR, {
        notFoundHeading: 'Introuvable',
      });

      await applyMigrationFile(db, NEST_MIGRATION);
      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readVoiceOverrides(db, tenantId)).toEqual({
        [LOCALE_ISO_CODES.FR]: { notFoundHeading: 'Introuvable' },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
