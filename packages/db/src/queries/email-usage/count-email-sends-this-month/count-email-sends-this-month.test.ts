import { EMAIL_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestEmailSendCount,
  MOCK_LAST_MONTH_DAY,
  MOCK_TODAY,
} from '@blog/db/testing/email-usage/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { utcMonthStartDay } from '@blog/utils/date';

import { countEmailSendsThisMonth } from './count-email-sends-this-month';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailSendCounts);
});

describe(countEmailSendsThisMonth, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('returns zero when nothing was sent', async () => {
    const total = await countEmailSendsThisMonth(
      tenantId,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
    );

    expect(total).toBe(0);
  });

  it("sums only this month's sends of the given type", async () => {
    await insertTestEmailSendCount(
      db(),
      tenantId,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
      MOCK_TODAY,
      40,
    );
    await insertTestEmailSendCount(
      db(),
      tenantId,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
      utcMonthStartDay(MOCK_NOW),
      60,
    );
    await insertTestEmailSendCount(
      db(),
      tenantId,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
      MOCK_LAST_MONTH_DAY,
      500,
    );
    await insertTestEmailSendCount(
      db(),
      tenantId,
      EMAIL_TYPE.SIGN_IN,
      MOCK_TODAY,
      7,
    );

    const total = await countEmailSendsThisMonth(
      tenantId,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
    );

    expect(total).toBe(100);
  });
});
