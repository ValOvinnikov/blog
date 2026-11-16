import {
  NEWSLETTER_POST_SEND_OUTCOME,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/db/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSent } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { MOCK_POST_ID } from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { markNewsletterPostSkipped } from './mark-newsletter-post-skipped';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(markNewsletterPostSkipped, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it.each(Object.values(NEWSLETTER_SKIP_REASON))(
    'records a claimed post as skipped for %s',
    async (skipReason) => {
      expect(
        await markNewsletterPostSkipped(tenantId, MOCK_POST_ID, skipReason),
      ).toBe(true);
      expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
        claimedAt: MOCK_NOW,
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
        skipReason,
      });
    },
  );

  it('leaves a sent post sent', async () => {
    await markNewsletterPostSent(tenantId, MOCK_POST_ID);

    expect(
      await markNewsletterPostSkipped(
        tenantId,
        MOCK_POST_ID,
        NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
      ),
    ).toBe(false);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
      claimedAt: MOCK_NOW,
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
      skipReason: undefined,
    });
  });
});
