import {
  NEWSLETTER_POST_SEND_OUTCOME,
  NEWSLETTER_SKIP_REASON,
} from '@shinefold/db/constants';
import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSkipped } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-skipped';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { MOCK_POST_ID } from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { markNewsletterPostSent } from './mark-newsletter-post-sent';

vi.mock('@shinefold/db/client');

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
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
      claimedAt: MOCK_NOW,
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
      skipReason: undefined,
    });
  });

  it('leaves a skipped post skipped', async () => {
    await markNewsletterPostSkipped(
      tenantId,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );

    expect(await markNewsletterPostSent(tenantId, MOCK_POST_ID)).toBe(false);
    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
      claimedAt: MOCK_NOW,
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
      skipReason: NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    });
  });
});
