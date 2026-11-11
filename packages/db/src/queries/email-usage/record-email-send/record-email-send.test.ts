import { EMAIL_TYPE } from '@blog/config/constants';
import { DAY_MS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_TODAY,
  readEmailSendCounts,
} from '@blog/db/testing/email-usage/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { recordEmailSend } from './record-email-send';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailSendCounts);
});

describe(recordEmailSend, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('counts each send against the tenant, the day and the email type', async () => {
    await recordEmailSend(tenantId, EMAIL_TYPE.NEWSLETTER_ISSUE);
    await recordEmailSend(tenantId, EMAIL_TYPE.SIGN_IN);
    await recordEmailSend(tenantId, EMAIL_TYPE.SIGN_IN);

    const rows = await readEmailSendCounts(db());
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        { tenantId, day: MOCK_TODAY, emailType: EMAIL_TYPE.SIGN_IN, count: 2 },
        {
          tenantId,
          day: MOCK_TODAY,
          emailType: EMAIL_TYPE.NEWSLETTER_ISSUE,
          count: 1,
        },
      ]),
    );
  });

  it('starts a new count on the next day', async () => {
    await recordEmailSend(tenantId, EMAIL_TYPE.SIGN_IN);
    vi.setSystemTime(MOCK_NOW.getTime() + DAY_MS);

    await recordEmailSend(tenantId, EMAIL_TYPE.SIGN_IN);

    const rows = await readEmailSendCounts(db());
    expect(rows.map(({ count }) => count)).toEqual([1, 1]);
  });

  it("keeps another tenant's sends apart", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());

    await recordEmailSend(tenantId, EMAIL_TYPE.SIGN_IN);
    await recordEmailSend(otherTenantId, EMAIL_TYPE.SIGN_IN);

    const rows = await readEmailSendCounts(db());
    expect(rows.map(({ count }) => count)).toEqual([1, 1]);
  });
});
