import { getNewsletterPausedAt } from '@blog/db/queries/email-config/get-newsletter-paused-at';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { pauseNewsletter } from './pause-newsletter';

vi.mock('@blog/db/client');

const MOCK_LATER = new Date(MOCK_NOW.getTime() + 60_000);

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailConfig);
});

describe(pauseNewsletter, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('pauses a site with no email config row', async () => {
    expect(await pauseNewsletter(tenantId)).toEqual(MOCK_NOW);
    expect(await getNewsletterPausedAt(tenantId)).toEqual(MOCK_NOW);
  });

  it('keeps the first pause time when paused again', async () => {
    await pauseNewsletter(tenantId);
    vi.setSystemTime(MOCK_LATER);

    expect(await pauseNewsletter(tenantId)).toEqual(MOCK_NOW);
  });

  it('leaves the rest of an existing email config row alone', async () => {
    await db()
      .insert(schema.emailConfig)
      .values({ tenantId, emailNewPosts: false });

    await pauseNewsletter(tenantId);

    const [row] = await db().select().from(schema.emailConfig);
    expect(row?.emailNewPosts).toBe(false);
  });
});
