import { CARD_STYLE, LOCALE_ISO_CODES } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  DEFAULT_CONTROL_STYLES,
  MOCK_NOT_FOUND_HEADING,
  MOCK_SITE_CONFIG_FIELDS,
} from '@blog/db/testing/site-config/fixtures';
import { faker } from '@faker-js/faker';

import { getSiteConfig } from './get-site-config';

faker.seed(6022);

vi.mock('@blog/db/client');

const MOCK_EN_NOT_FOUND_HEADING = faker.lorem.words(3);

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.siteConfig);
  await db().delete(schema.tenants);
});

describe(getSiteConfig, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns undefined when the tenant has no config row', async () => {
    const result = await getSiteConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null theme columns to undefined', async () => {
    const [row] = await db()
      .insert(schema.siteConfig)
      .values({ tenantId, ...MOCK_SITE_CONFIG_FIELDS })
      .returning();

    const result = await getSiteConfig(tenantId);

    expect(result).toEqual({
      ...row,
      cardStyle: CARD_STYLE.ACCENT_BAR,
      logoHue: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });
  });

  it('reads the default control styles for a row stored without them', async () => {
    await db()
      .insert(schema.siteConfig)
      .values({ tenantId, ...MOCK_SITE_CONFIG_FIELDS });

    const result = await getSiteConfig(tenantId);

    expect(result).toMatchObject(DEFAULT_CONTROL_STYLES);
  });

  it("returns every language's overrides and the default language's slice", async () => {
    const { id: germanTenantId } = await insertTestTenant(db(), {
      locale: LOCALE_ISO_CODES.DE,
    });
    const voiceOverridesByLocale = {
      [LOCALE_ISO_CODES.DE]: { notFoundHeading: MOCK_NOT_FOUND_HEADING },
      [LOCALE_ISO_CODES.EN]: { notFoundHeading: MOCK_EN_NOT_FOUND_HEADING },
    };
    const [row] = await db()
      .insert(schema.siteConfig)
      .values({
        tenantId: germanTenantId,
        ...MOCK_SITE_CONFIG_FIELDS,
        voiceOverridesByLocale,
      })
      .returning();

    const result = await getSiteConfig(germanTenantId);

    expect(result).toEqual({
      ...row,
      logoHue: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: { notFoundHeading: MOCK_NOT_FOUND_HEADING },
    });
  });
});
