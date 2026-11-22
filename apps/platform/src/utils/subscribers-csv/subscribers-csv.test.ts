import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/tenant-identity';

import { toSubscribersCsv, toSubscribersFileName } from './subscribers-csv';

faker.seed(7164);

const MOCK_EMAIL = faker.internet.email();
const MOCK_CONFIRMED_AT = new Date('2026-11-03T09:15:00.000Z');
const MOCK_EXPORTED_AT = new Date('2026-11-22T23:30:00.000Z');
const UTF8_BOM = '﻿';

describe(toSubscribersCsv, () => {
  it('writes a header row and each subscriber with a UTC ISO confirmation time', () => {
    const csv = toSubscribersCsv([
      { email: MOCK_EMAIL, confirmedAt: MOCK_CONFIRMED_AT },
    ]);

    expect(csv).toBe(
      `${UTF8_BOM}email,confirmed_at\r\n${MOCK_EMAIL},2026-11-03T09:15:00.000Z\r\n`,
    );
  });

  it('leaves the email empty when it cannot be read', () => {
    const csv = toSubscribersCsv([
      { email: undefined, confirmedAt: MOCK_CONFIRMED_AT },
    ]);

    expect(csv).toContain('\r\n,2026-11-03T09:15:00.000Z\r\n');
  });
});

describe(toSubscribersFileName, () => {
  it("names the file after the site's first address label and the UTC day", () => {
    expect(toSubscribersFileName(MOCK_TENANT_DOMAIN, MOCK_EXPORTED_AT)).toBe(
      `subscribers-${MOCK_TENANT_SLUG}-2026-11-22.csv`,
    );
  });
});
