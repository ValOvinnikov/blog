import { NEWSLETTER_SKIP_REASON } from '@shinefold/config/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { markNewsletterPostSent } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_LATER,
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
  MOCK_SKIP_DETAILS,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getLatestSkippedNewsletterPost } from './get-latest-skipped-newsletter-post';

vi.mock('@shinefold/db/client');

const { OVER_MONTHLY_ALLOWANCE, OVER_SUBSCRIBER_BAND, SENDING_OFF } =
  NEWSLETTER_SKIP_REASON;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

async function skip(
  tenantId: string,
  postId: string,
  reason: typeof OVER_MONTHLY_ALLOWANCE | typeof SENDING_OFF,
): Promise<void> {
  await claimNewsletterPostSend(tenantId, postId);
  await markNewsletterPostSkipped(tenantId, postId, reason, MOCK_SKIP_DETAILS);
}

describe(getLatestSkippedNewsletterPost, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('returns the newest post skipped for the reason, with what the notice names', async () => {
    await skip(tenantId, MOCK_OTHER_POST_ID, OVER_MONTHLY_ALLOWANCE);
    vi.setSystemTime(MOCK_LATER);
    await skip(tenantId, MOCK_POST_ID, OVER_MONTHLY_ALLOWANCE);

    const { emailsNeeded, allowanceLeft, postTitle, postPublishedAt } =
      MOCK_SKIP_DETAILS;
    expect(
      await getLatestSkippedNewsletterPost(tenantId, OVER_MONTHLY_ALLOWANCE),
    ).toEqual({
      postId: MOCK_POST_ID,
      postTitle,
      postPublishedAt,
      emailsNeeded,
      allowanceLeft,
      skippedAt: MOCK_LATER,
    });
  });

  describe('with a post skipped for the allowance', () => {
    beforeEach(async () => {
      await skip(tenantId, MOCK_POST_ID, OVER_MONTHLY_ALLOWANCE);
      vi.setSystemTime(MOCK_LATER);
    });

    it('returns none for another reason or another site', async () => {
      const { id: otherTenantId } = await insertTestTenant(db());
      await claimNewsletterPostSend(otherTenantId, MOCK_POST_ID);
      await markNewsletterPostSkipped(
        otherTenantId,
        MOCK_POST_ID,
        OVER_SUBSCRIBER_BAND,
      );

      expect(
        await getLatestSkippedNewsletterPost(tenantId, OVER_SUBSCRIBER_BAND),
      ).toBeUndefined();
    });

    it('never returns a post skipped for an off cause', async () => {
      await skip(tenantId, MOCK_OTHER_POST_ID, SENDING_OFF);

      expect(
        await getLatestSkippedNewsletterPost(tenantId, OVER_MONTHLY_ALLOWANCE),
      ).toMatchObject({ postId: MOCK_POST_ID });
    });

    it('resets once a later post is sent', async () => {
      await claimNewsletterPostSend(tenantId, MOCK_OTHER_POST_ID);
      await markNewsletterPostSent(tenantId, MOCK_OTHER_POST_ID);

      expect(
        await getLatestSkippedNewsletterPost(tenantId, OVER_MONTHLY_ALLOWANCE),
      ).toBeUndefined();
    });
  });

  it('returns a post skipped after the last sent one', async () => {
    await claimNewsletterPostSend(tenantId, MOCK_OTHER_POST_ID);
    await markNewsletterPostSent(tenantId, MOCK_OTHER_POST_ID);
    vi.setSystemTime(MOCK_LATER);
    await skip(tenantId, MOCK_POST_ID, OVER_MONTHLY_ALLOWANCE);

    expect(
      await getLatestSkippedNewsletterPost(tenantId, OVER_MONTHLY_ALLOWANCE),
    ).toMatchObject({ postId: MOCK_POST_ID, skippedAt: MOCK_LATER });
  });
});
