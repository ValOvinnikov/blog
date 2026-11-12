import { getNewsletterPausedAt } from '@blog/db/queries/email-config/get-newsletter-paused-at';
import { pauseNewsletter } from '@blog/db/queries/email-config/pause-newsletter';
import * as schema from '@blog/db/schema';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { clearNewsletterPause } from './clear-newsletter-pause';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailConfig);
});

describe(clearNewsletterPause, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('clears a pause, so the site reads as not paused', async () => {
    await pauseNewsletter(tenantId);

    await clearNewsletterPause(tenantId);

    expect(await getNewsletterPausedAt(tenantId)).toBeUndefined();
  });

  it('does nothing for a site that was never paused', async () => {
    await clearNewsletterPause(tenantId);

    expect(await getNewsletterPausedAt(tenantId)).toBeUndefined();
    expect(await db().select().from(schema.emailConfig)).toEqual([]);
  });
});
