import {
  MOCK_CONFIRMED_AT,
  MOCK_EXPORTED_AT,
  MOCK_EXPORTED_DAY,
  MOCK_SUBSCRIBER_EMAIL,
} from '@platform/testing/subscribers/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/tenant-identity';
import { UTF8_BOM } from '@shinefold/utils/csv';

import { toSubscribersCsv, toSubscribersFileName } from './subscribers-csv';

describe(toSubscribersCsv, () => {
  it('writes a header row and each subscriber with a UTC ISO confirmation time', () => {
    const csv = toSubscribersCsv([
      { email: MOCK_SUBSCRIBER_EMAIL, confirmedAt: MOCK_CONFIRMED_AT },
    ]);

    expect(csv).toBe(
      `${UTF8_BOM}email,confirmed_at\r\n${MOCK_SUBSCRIBER_EMAIL},${MOCK_CONFIRMED_AT.toISOString()}\r\n`,
    );
  });
});

describe(toSubscribersFileName, () => {
  it("names the file after the site's first address label and the UTC day", () => {
    expect(toSubscribersFileName(MOCK_TENANT_DOMAIN, MOCK_EXPORTED_AT)).toBe(
      `subscribers-${MOCK_TENANT_SLUG}-${MOCK_EXPORTED_DAY}.csv`,
    );
  });
});
