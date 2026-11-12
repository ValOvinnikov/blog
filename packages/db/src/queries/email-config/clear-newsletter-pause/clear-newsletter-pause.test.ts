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

  describe('a paused site', () => {
    let pausedAt: Date;

    beforeEach(async () => {
      pausedAt = await pauseNewsletter(tenantId);
    });

    it('clears the pause and returns the time it was paused', async () => {
      const clearedPausedAt = await clearNewsletterPause(tenantId);

      expect(clearedPausedAt).toEqual(pausedAt);
      expect(await getNewsletterPausedAt(tenantId)).toBeUndefined();
    });

    it('clears for only the first of two callers', async () => {
      await clearNewsletterPause(tenantId);

      const secondClear = await clearNewsletterPause(tenantId);

      expect(secondClear).toBeUndefined();
    });
  });

  it('does nothing for a site that was never paused', async () => {
    const clearedPausedAt = await clearNewsletterPause(tenantId);

    expect(clearedPausedAt).toBeUndefined();
    expect(await db().select().from(schema.emailConfig)).toEqual([]);
  });
});
