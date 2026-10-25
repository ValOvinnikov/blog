import { TERMS_VERSION } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { recordTermsAcceptance } from './record-terms-acceptance';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const USER_ID = 'terms-user';
const ACCEPTED_AT = new Date('2026-10-20T09:00:00Z');

async function readUser() {
  const [user] = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, USER_ID));
  return user;
}

beforeEach(async () => {
  await db().insert(schema.users).values({ id: USER_ID });
});

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.users);
});

describe(recordTermsAcceptance, () => {
  it('stamps the acceptance time and version on the user', async () => {
    vi.useFakeTimers({ now: ACCEPTED_AT });

    await recordTermsAcceptance(USER_ID, TERMS_VERSION);

    expect(await readUser()).toMatchObject({
      termsAcceptedAt: ACCEPTED_AT,
      termsVersion: TERMS_VERSION,
    });
  });

  it('keeps the first acceptance when called again', async () => {
    vi.useFakeTimers({ now: ACCEPTED_AT });
    await recordTermsAcceptance(USER_ID, TERMS_VERSION);
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));

    await recordTermsAcceptance(USER_ID, '2026-11-01');

    expect(await readUser()).toMatchObject({
      termsAcceptedAt: ACCEPTED_AT,
      termsVersion: TERMS_VERSION,
    });
  });
});
