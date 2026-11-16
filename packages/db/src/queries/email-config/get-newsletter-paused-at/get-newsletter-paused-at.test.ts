import { pauseNewsletter } from '@shinefold/db/queries/email-config/pause-newsletter';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getNewsletterPausedAt } from './get-newsletter-paused-at';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailConfig);
});

describe(getNewsletterPausedAt, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('reads no pause for a site with no email config row', async () => {
    expect(await getNewsletterPausedAt(tenantId)).toBeUndefined();
  });

  it("reads a site's own pause and not another site's", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await pauseNewsletter(otherTenantId);
    await pauseNewsletter(tenantId);

    expect(await getNewsletterPausedAt(tenantId)).toEqual(MOCK_NOW);
  });
});
