import {
  NEWSLETTER_POST_SEND_OUTCOME,
  NEWSLETTER_SKIP_REASON,
  type TNewsletterPostSendOutcome,
} from '@blog/db/constants';
import { claimNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { markNewsletterPostSent } from '@blog/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import { markNewsletterPostSkipped } from '@blog/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { MOCK_POST_ID } from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { releaseNewsletterPostSend } from './release-newsletter-post-send';

vi.mock('@blog/db/client');

const RECORD_OUTCOME: Record<
  TNewsletterPostSendOutcome,
  (tenantId: string, postId: string) => Promise<boolean>
> = {
  [NEWSLETTER_POST_SEND_OUTCOME.SENT]: markNewsletterPostSent,
  [NEWSLETTER_POST_SEND_OUTCOME.SKIPPED]: (tenantId, postId) =>
    markNewsletterPostSkipped(
      tenantId,
      postId,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    ),
};
const MOCK_EARLIER_CLAIMED_AT = new Date(MOCK_NOW.getTime() - 60_000);

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(releaseNewsletterPostSend, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it('gives back the claim it took, so the post can be claimed again', async () => {
    await releaseNewsletterPostSend(tenantId, MOCK_POST_ID, MOCK_NOW);

    const reclaim = await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
    expect(reclaim).toEqual({ claimedAt: MOCK_NOW });
  });

  it('leaves a claim taken at another time in place', async () => {
    await releaseNewsletterPostSend(
      tenantId,
      MOCK_POST_ID,
      MOCK_EARLIER_CLAIMED_AT,
    );

    const reclaim = await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
    expect(reclaim).toBeNull();
  });

  it.each(Object.values(NEWSLETTER_POST_SEND_OUTCOME))(
    'never releases a claim with a recorded %s outcome',
    async (outcome) => {
      await RECORD_OUTCOME[outcome](tenantId, MOCK_POST_ID);

      await releaseNewsletterPostSend(tenantId, MOCK_POST_ID, MOCK_NOW);

      expect(await claimNewsletterPostSend(tenantId, MOCK_POST_ID)).toBeNull();
    },
  );
});
