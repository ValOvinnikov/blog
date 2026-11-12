import { NEWSLETTER_POST_SEND_OUTCOME } from '@blog/db/constants';
import { claimNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/get-newsletter-post-send';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { MOCK_POST_ID } from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { markNewsletterPostSent } from './mark-newsletter-post-sent';

vi.mock('@blog/db/client');

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
    await markNewsletterPostSent(tenantId, MOCK_POST_ID);

    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
      claimedAt: MOCK_NOW,
      outcome: NEWSLETTER_POST_SEND_OUTCOME.SENT,
      skipReason: undefined,
    });
  });
});
