import { faker } from '@faker-js/faker';
import { CARD_STYLE, LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  DEFAULT_CONTROL_STYLES,
  MOCK_NOT_FOUND_HEADING,
  insertTestSiteConfig,
} from '@shinefold/db/testing/site-config/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getSiteConfig } from './get-site-config';

faker.seed(6022);

vi.mock('@shinefold/db/client');

const MOCK_EN_NOT_FOUND_HEADING = faker.lorem.words(3);
const MOCK_LOOK_SAVED_AT = faker.date.past();

const db = useQueryTestDb();

const tenant = useTestTenant(db);

describe(getSiteConfig, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('returns undefined when the tenant has no config row', async () => {
    const result = await getSiteConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null theme columns to undefined', async () => {
    const row = await insertTestSiteConfig(db(), tenantId);

    const result = await getSiteConfig(tenantId);

    expect(result).toEqual({
      ...row,
      cardStyle: CARD_STYLE.ACCENT_BAR,
      logoHue: undefined,
      brandName: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      lookSavedAt: undefined,
      voiceSavedAt: undefined,
      voiceOverrides: {},
    });
  });

  it('reads the default control styles for a row stored without them', async () => {
    await insertTestSiteConfig(db(), tenantId);

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
    const row = await insertTestSiteConfig(db(), germanTenantId, {
      voiceOverridesByLocale,
    });

    const result = await getSiteConfig(germanTenantId);

    expect(result).toEqual({
      ...row,
      logoHue: undefined,
      brandName: undefined,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      lookSavedAt: undefined,
      voiceSavedAt: undefined,
      voiceOverrides: { notFoundHeading: MOCK_NOT_FOUND_HEADING },
    });
  });

  it('returns when the Look was last saved', async () => {
    await insertTestSiteConfig(db(), tenantId, {
      lookSavedAt: MOCK_LOOK_SAVED_AT,
    });

    const result = await getSiteConfig(tenantId);

    expect(result?.lookSavedAt).toEqual(MOCK_LOOK_SAVED_AT);
  });
});
