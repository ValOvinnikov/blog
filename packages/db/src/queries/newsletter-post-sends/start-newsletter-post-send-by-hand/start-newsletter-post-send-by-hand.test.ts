import {
  NEWSLETTER_HAND_SENDABLE_SKIP_REASONS,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/config/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSent } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import { recordNewsletterPostSendStart } from '@shinefold/db/queries/newsletter-post-sends/record-newsletter-post-send-start';
import { setNewsletterPostSendSchedule } from '@shinefold/db/queries/newsletter-post-sends/set-newsletter-post-send-schedule';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_LATER,
  mockNewsletterPostSend,
  MOCK_POST_ID,
  MOCK_POST_SEND_START,
  MOCK_SCHEDULED_FOR,
  MOCK_SKIP_DETAILS,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { isUndefined } from '@shinefold/utils/primitives';

import { startNewsletterPostSendByHand } from './start-newsletter-post-send-by-hand';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(startNewsletterPostSendByHand, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('claims a post with no claim as waiting to send', async () => {
    expect(await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID)).toEqual(
      { claimedAt: MOCK_NOW, clearedSkipReason: undefined },
    );
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
      mockNewsletterPostSend({ handStartedAt: MOCK_NOW }),
    );
  });

  it.each(NEWSLETTER_HAND_SENDABLE_SKIP_REASONS)(
    'turns a post skipped for %s into one waiting to send, under a new claim',
    async (skipReason) => {
      await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
      await markNewsletterPostSkipped(
        tenantId,
        MOCK_POST_ID,
        skipReason,
        MOCK_SKIP_DETAILS,
      );
      vi.setSystemTime(MOCK_LATER);

      expect(
        await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
      ).toEqual({ claimedAt: MOCK_LATER, clearedSkipReason: skipReason });
      expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual(
        mockNewsletterPostSend({
          claimedAt: MOCK_LATER,
          handStartedAt: MOCK_LATER,
          postTitle: MOCK_SKIP_DETAILS.postTitle,
          postPublishedAt: MOCK_SKIP_DETAILS.postPublishedAt,
        }),
      );
    },
  );

  it.each([
    NEWSLETTER_SKIP_REASON.NOT_IN_PLAN,
    NEWSLETTER_SKIP_REASON.SITE_INACTIVE,
    NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    NEWSLETTER_SKIP_REASON.REPUTATION_STOP,
  ])('refuses a post skipped for %s', async (skipReason) => {
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
    await markNewsletterPostSkipped(tenantId, MOCK_POST_ID, skipReason);

    expect(
      await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
    ).toBeUndefined();
  });

  it.each([
    ['queued', async () => undefined],
    [
      'scheduled',
      (tenantId: string) =>
        setNewsletterPostSendSchedule(
          tenantId,
          MOCK_POST_ID,
          MOCK_NOW,
          MOCK_SCHEDULED_FOR,
        ),
    ],
    [
      'sending',
      (tenantId: string) =>
        recordNewsletterPostSendStart(
          tenantId,
          MOCK_POST_ID,
          MOCK_NOW,
          MOCK_POST_SEND_START,
        ),
    ],
    [
      'sent',
      (tenantId: string) => markNewsletterPostSent(tenantId, MOCK_POST_ID),
    ],
  ])('refuses a post whose claim is %s', async (_state, arrange) => {
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
    await arrange(tenantId);

    expect(
      await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
    ).toBeUndefined();
  });

  it('refuses a second start while the first is queued', async () => {
    await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID);

    expect(
      await startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
    ).toBeUndefined();
  });

  it('lets exactly one of two concurrent starts through', async () => {
    const results = await Promise.all([
      startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
      startNewsletterPostSendByHand(tenantId, MOCK_POST_ID),
    ]);

    expect(results.filter((result) => !isUndefined(result))).toHaveLength(1);
  });
});
