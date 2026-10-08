import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import { siteConfig } from './site-config';
import { tenants } from './tenants';

const NEST_MIGRATION = '0037_nest_voice_overrides_by_locale.sql';

async function setUpDbBeforeNestMigration() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

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
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: `tenant-${locale}`,
      primaryDomain: `${locale}.example.com`,
      locale,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  if (!tenant) throw new Error('failed to seed a tenant row');

  await db.insert(siteConfig).values({
    tenantId: tenant.id,
    preset: PRESET_ID.EDITORIAL,
    accentHue: 28,
    headingFont: FONT_CHOICE.FRAUNCES,
    bodyFont: FONT_CHOICE.INTER,
    radiusScale: RADIUS_SCALE.SM,
    density: DENSITY.COMPACT,
    voiceOverridesByLocale: sql`${JSON.stringify(voiceOverrides)}::jsonb`,
  });

  return tenant.id;
}

async function readVoiceOverrides(db: TDb, tenantId: string) {
  const [row] = await db
    .select()
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
        { notFoundHeading: 'Nicht gefunden', blogListEmpty: richValue },
      );
      const englishTenant = await seedTenantWithOverrides(
        db,
        LOCALE_ISO_CODES.EN,
        { notFoundHeading: 'Lost the plot?' },
      );

      await applyMigrationFile(db, NEST_MIGRATION);

      expect(await readVoiceOverrides(db, germanTenant)).toEqual({
        [LOCALE_ISO_CODES.DE]: {
          notFoundHeading: 'Nicht gefunden',
          blogListEmpty: richValue,
        },
      });
      expect(await readVoiceOverrides(db, englishTenant)).toEqual({
        [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'Lost the plot?' },
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
