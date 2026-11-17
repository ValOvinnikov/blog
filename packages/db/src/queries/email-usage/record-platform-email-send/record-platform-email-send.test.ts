import { EMAIL_TYPE } from '@shinefold/config/constants';
import { DAY_MS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_TODAY,
  readEmailSendCounts,
  readPlatformEmailSendCounts,
} from '@shinefold/db/testing/email-usage/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { recordPlatformEmailSend } from './record-platform-email-send';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.platformEmailSendCounts);
});

describe(recordPlatformEmailSend, () => {
  it('counts each send against the day and the email type, never a site', async () => {
    await recordPlatformEmailSend(EMAIL_TYPE.INVITE);
    await recordPlatformEmailSend(EMAIL_TYPE.SIGN_IN);
    await recordPlatformEmailSend(EMAIL_TYPE.SIGN_IN);

    const rows = await readPlatformEmailSendCounts(db());
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        { day: MOCK_TODAY, emailType: EMAIL_TYPE.SIGN_IN, count: 2 },
        { day: MOCK_TODAY, emailType: EMAIL_TYPE.INVITE, count: 1 },
      ]),
    );
    expect(await readEmailSendCounts(db())).toEqual([]);
  });

  it('starts a new count on the next day', async () => {
    await recordPlatformEmailSend(EMAIL_TYPE.SIGN_IN);
    vi.setSystemTime(MOCK_NOW.getTime() + DAY_MS);

    await recordPlatformEmailSend(EMAIL_TYPE.SIGN_IN);

    const rows = await readPlatformEmailSendCounts(db());
    expect(rows.map(({ count }) => count)).toEqual([1, 1]);
  });
});
