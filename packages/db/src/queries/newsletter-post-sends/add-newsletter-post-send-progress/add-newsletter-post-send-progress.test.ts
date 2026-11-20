import { claimNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import { getNewsletterPostSend } from '@shinefold/db/queries/newsletter-post-sends/get-newsletter-post-send';
import { markNewsletterPostSent } from '@shinefold/db/queries/newsletter-post-sends/mark-newsletter-post-sent';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import {
  MOCK_EARLIER_CLAIMED_AT,
  MOCK_POST_ID,
} from '@shinefold/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { addNewsletterPostSendProgress } from './add-newsletter-post-send-progress';

vi.mock('@shinefold/db/client');

const MOCK_FIRST_PAGE_SENT = 50;
const MOCK_SECOND_PAGE_SENT = 7;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(addNewsletterPostSendProgress, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = tenant());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);
  });

  it('adds each page to how many the send has reached so far', async () => {
    await addNewsletterPostSendProgress(
      tenantId,
      MOCK_POST_ID,
      MOCK_NOW,
      MOCK_FIRST_PAGE_SENT,
    );
    await addNewsletterPostSendProgress(
      tenantId,
      MOCK_POST_ID,
      MOCK_NOW,
      MOCK_SECOND_PAGE_SENT,
    );

    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toMatchObject({
      sentCount: MOCK_FIRST_PAGE_SENT + MOCK_SECOND_PAGE_SENT,
    });
  });

  it('leaves a claim taken at another time alone', async () => {
    expect(
      await addNewsletterPostSendProgress(
        tenantId,
        MOCK_POST_ID,
        MOCK_EARLIER_CLAIMED_AT,
        MOCK_FIRST_PAGE_SENT,
      ),
    ).toBe(false);
  });

  it('leaves a sent claim alone', async () => {
    await markNewsletterPostSent(tenantId, MOCK_POST_ID);

    expect(
      await addNewsletterPostSendProgress(
        tenantId,
        MOCK_POST_ID,
        MOCK_NOW,
        MOCK_FIRST_PAGE_SENT,
      ),
    ).toBe(false);
  });
});
