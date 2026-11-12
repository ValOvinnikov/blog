import { NEWSLETTER_LIMIT_NOTICE_KIND } from '@blog/db/constants';
import { markNewsletterLimitNoticeSent } from '@blog/db/queries/newsletter-post-sends/mark-newsletter-limit-notice-sent';
import * as schema from '@blog/db/schema';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { MOCK_NEXT_MONTH } from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { releaseNewsletterLimitNotice } from './release-newsletter-limit-notice';

vi.mock('@blog/db/client');

const { SENDING_PAUSED, MONTHLY_ALLOWANCE_NEAR } = NEWSLETTER_LIMIT_NOTICE_KIND;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterLimitNotices);
});

describe(releaseNewsletterLimitNotice, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('leaves another notice kind marked', async () => {
    await markNewsletterLimitNoticeSent(tenantId, MONTHLY_ALLOWANCE_NEAR);

    await releaseNewsletterLimitNotice(tenantId, SENDING_PAUSED);

    expect(
      await markNewsletterLimitNoticeSent(tenantId, MONTHLY_ALLOWANCE_NEAR),
    ).toBe(false);
  });

  describe("with this month's notice marked", () => {
    beforeEach(async () => {
      await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED);
    });

    it('gives it back so it can be marked again', async () => {
      await releaseNewsletterLimitNotice(tenantId, SENDING_PAUSED);

      expect(
        await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED),
      ).toBe(true);
    });

    it('leaves it alone once the month is over', async () => {
      vi.setSystemTime(MOCK_NEXT_MONTH);

      await releaseNewsletterLimitNotice(tenantId, SENDING_PAUSED);

      expect(
        await db().select().from(schema.newsletterLimitNotices),
      ).toHaveLength(1);
    });
  });
});
