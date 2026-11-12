import {
  NEWSLETTER_POST_SEND_OUTCOME,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { claimNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { releaseNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/release-newsletter-post-send';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { MOCK_POST_ID } from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { markNewsletterPostSkipped } from './mark-newsletter-post-skipped';

vi.mock('@blog/db/client');

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
      await markNewsletterPostSkipped(tenantId, MOCK_POST_ID, skipReason);

      expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
        claimedAt: MOCK_NOW,
        outcome: NEWSLETTER_POST_SEND_OUTCOME.SKIPPED,
        skipReason,
      });
    },
  );

  it('keeps a skipped post claimed, so it is never sent again', async () => {
    await markNewsletterPostSkipped(
      tenantId,
      MOCK_POST_ID,
      NEWSLETTER_SKIP_REASON.SITE_PAUSED,
    );
    await releaseNewsletterPostSend(tenantId, MOCK_POST_ID, MOCK_NOW);

    expect(await claimNewsletterPostSend(tenantId, MOCK_POST_ID)).toBeNull();
  });
});
