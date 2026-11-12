import { NEWSLETTER_LIMIT_NOTICE_KIND } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { MOCK_NEXT_MONTH } from '@blog/db/testing/newsletter-post-sends/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { markNewsletterLimitNoticeSent } from './mark-newsletter-limit-notice-sent';

vi.mock('@blog/db/client');

const { SENDING_PAUSED, MONTHLY_ALLOWANCE_NEAR } = NEWSLETTER_LIMIT_NOTICE_KIND;

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.newsletterLimitNotices);
});

describe(markNewsletterLimitNoticeSent, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('marks a notice once in a month and refuses the second', async () => {
    expect(await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED)).toBe(
      true,
    );
    expect(await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED)).toBe(
      false,
    );
  });

  it('lets exactly one of two concurrent marks through', async () => {
    const results = await Promise.all([
      markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED),
      markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('starts fresh the next month', async () => {
    await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED);
    vi.setSystemTime(MOCK_NEXT_MONTH);

    expect(await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED)).toBe(
      true,
    );
  });

  it('marks another notice kind, and the same kind on another site', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await markNewsletterLimitNoticeSent(tenantId, SENDING_PAUSED);

    expect(
      await markNewsletterLimitNoticeSent(tenantId, MONTHLY_ALLOWANCE_NEAR),
    ).toBe(true);
    expect(
      await markNewsletterLimitNoticeSent(otherTenantId, SENDING_PAUSED),
    ).toBe(true);
  });
});
