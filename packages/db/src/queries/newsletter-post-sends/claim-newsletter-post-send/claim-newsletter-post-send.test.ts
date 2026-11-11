import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import {
  MOCK_OTHER_POST_ID,
  MOCK_POST_ID,
} from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { isNull } from '@blog/utils/primitives';

import { claimNewsletterPostSend } from './claim-newsletter-post-send';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterPostSends);
});

describe(claimNewsletterPostSend, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('claims a post never sent before', async () => {
    const claim = await claimNewsletterPostSend(tenantId, MOCK_POST_ID);

    expect(claim).toEqual({ claimedAt: MOCK_NOW });
  });

  it('refuses a second claim for the same post', async () => {
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);

    const second = await claimNewsletterPostSend(tenantId, MOCK_POST_ID);

    expect(second).toBeNull();
  });

  it('lets exactly one of two concurrent claims through', async () => {
    const results = await Promise.all([
      claimNewsletterPostSend(tenantId, MOCK_POST_ID),
      claimNewsletterPostSend(tenantId, MOCK_POST_ID),
    ]);

    expect(results.filter((result) => !isNull(result))).toHaveLength(1);
  });

  it('claims another post, and the same post id on another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await claimNewsletterPostSend(tenantId, MOCK_POST_ID);

    const otherPost = await claimNewsletterPostSend(
      tenantId,
      MOCK_OTHER_POST_ID,
    );
    const otherTenant = await claimNewsletterPostSend(
      otherTenantId,
      MOCK_POST_ID,
    );

    expect(otherPost).not.toBeNull();
    expect(otherTenant).not.toBeNull();
  });
});
