import { NEWSLETTER_SKIP_REASON } from '@shinefold/config/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_EARLIER_CLAIMED_AT,
  mockNewsletterPostSend,
  MOCK_POST_ID,
  MOCK_POST_SEND_START,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { recordNewsletterPostSendStart } from './record-newsletter-post-send-start';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(recordNewsletterPostSendStart, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it("records the post's title and date and how many subscribers the send targets", async () => {
    expect(
      await recordNewsletterPostSendStart(
        tenantId,
        MOCK_POST_ID,
        MOCK_NOW,
        MOCK_POST_SEND_START,
      ),
    ).toBe(true);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
      mockNewsletterPostSend(MOCK_POST_SEND_START),
    );
  });

  it('leaves a claim taken at another time alone', async () => {
    expect(
      await recordNewsletterPostSendStart(
        tenantId,
        MOCK_POST_ID,
        MOCK_EARLIER_CLAIMED_AT,
        MOCK_POST_SEND_START,
      ),
    ).toBe(false);
  });

  it('leaves a settled claim alone', async () => {
    await markNewsletterPostSkipped(
      tenantId,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );

    expect(
      await recordNewsletterPostSendStart(
        tenantId,
        MOCK_POST_ID,
        MOCK_NOW,
        MOCK_POST_SEND_START,
      ),
    ).toBe(false);
  });
});
