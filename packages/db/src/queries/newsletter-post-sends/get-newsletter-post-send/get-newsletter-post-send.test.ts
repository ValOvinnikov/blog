import { claimNewsletterPostSend } from '@blog/db/queries/newsletter-post-sends/claim-newsletter-post-send';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { getNewsletterPostSend } from './get-newsletter-post-send';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(getNewsletterPostSend, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('reads nothing for a post never claimed', async () => {
    await claimNewsletterPostSend(tenantId, MOCK_OTHER_POST_ID);

    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toBeUndefined();
  });

  it('reads a claim with no outcome yet', async () => {
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);

    expect(await getNewsletterPostSend(tenantId, MOCK_POST_ID)).toEqual({
      claimedAt: MOCK_NOW,
      outcome: undefined,
      skipReason: undefined,
    });
  });
});
