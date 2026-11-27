import { NEWSLETTER_POST_SEND_OUTCOME } from '@shinefold/db/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSent } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import { recordNewsletterPostSendStart } from '@shinefold/db/queries/newsletter-post-sends/record-newsletter-post-send-start';
import { setNewsletterPostSendProgress } from '@shinefold/db/queries/newsletter-post-sends/set-newsletter-post-send-progress';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  mockNewsletterPostSend,
  MOCK_POST_ID,
  MOCK_POST_SEND_START,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { markNewsletterPostFailed } from './mark-newsletter-post-failed';

vi.mock('@shinefold/db/client');

const MOCK_SENT_BEFORE_FAILING = 3;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(markNewsletterPostFailed, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it('settles a started send as failed, keeping how many it reached of how many', async () => {
    await recordNewsletterPostSendStart(
      tenantId,
      MOCK_POST_ID,
      MOCK_NOW,
      MOCK_POST_SEND_START,
    );
    await setNewsletterPostSendProgress(
      tenantId,
      MOCK_POST_ID,
      MOCK_NOW,
      MOCK_SENT_BEFORE_FAILING,
    );

    expect(await markNewsletterPostFailed(tenantId, MOCK_POST_ID)).toBe(true);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
      mockNewsletterPostSend({
        ...MOCK_POST_SEND_START,
        outcome: NEWSLETTER_POST_SEND_OUTCOME.FAILED,
        sentCount: MOCK_SENT_BEFORE_FAILING,
        settledAt: MOCK_NOW,
      }),
    );
  });

  it('leaves a sent post sent', async () => {
    await markNewsletterPostSent(tenantId, MOCK_POST_ID);

    expect(await markNewsletterPostFailed(tenantId, MOCK_POST_ID)).toBe(false);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toMatchObject({
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
    });
  });
});
