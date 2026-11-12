import { pauseNewsletter } from '@blog/db/queries/email-config/pause-newsletter';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { getNewsletterPausedAt } from './get-newsletter-paused-at';

vi.mock('@blog/db/client');

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
