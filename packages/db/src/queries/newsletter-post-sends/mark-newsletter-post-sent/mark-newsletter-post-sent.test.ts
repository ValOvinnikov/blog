import { NEWSLETTER_SKIP_REASON } from '@shinefold/config/constants';
import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import { recordNewsletterPostSendStart } from '@shinefold/db/queries/newsletter-post-sends/record-newsletter-post-send-start';
import { setNewsletterPostSendProgress } from '@shinefold/db/queries/newsletter-post-sends/set-newsletter-post-send-progress';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  mockNewsletterPostSend,
  MOCK_POST_ID,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { markNewsletterPostSent } from './mark-newsletter-post-sent';

vi.mock('@shinefold/db/client');

const MOCK_RECIPIENTS_AT_START = 1_000;
const MOCK_RECIPIENTS_REACHED = 1_001;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(markNewsletterPostSent, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it('records a claimed post as sent', async () => {
    expect(await markNewsletterPostSent(tenantId, MOCK_POST_ID)).toBe(true);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
      mockNewsletterPostSend({
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
        recipientCount: 0,
        settledAt: MOCK_NOW,
      }),
    );
  });

  it('makes the recipient count the number the send reached', async () => {
    await recordNewsletterPostSendStart(tenantId, MOCK_POST_ID, MOCK_NOW, {
      postTitle: MOCK_POST_ID,
      postPublishedAt: MOCK_NOW,
      recipientCount: MOCK_RECIPIENTS_AT_START,
    });
    await setNewsletterPostSendProgress(
      tenantId,
      MOCK_POST_ID,
      MOCK_NOW,
      MOCK_RECIPIENTS_REACHED,
    );

    await markNewsletterPostSent(tenantId, MOCK_POST_ID);

    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toMatchObject({
      recipientCount: MOCK_RECIPIENTS_REACHED,
      sentCount: MOCK_RECIPIENTS_REACHED,
    });
  });

  it('leaves a skipped post skipped', async () => {
    await markNewsletterPostSkipped(
      tenantId,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );

    expect(await markNewsletterPostSent(tenantId, MOCK_POST_ID)).toBe(false);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
      mockNewsletterPostSend({
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
        skipReason: NEWSLETTER_SKIP_REASON.SITE_PAUSED,
        settledAt: MOCK_NOW,
      }),
    );
  });
});
