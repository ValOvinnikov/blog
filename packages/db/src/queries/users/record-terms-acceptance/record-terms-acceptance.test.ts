import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { recordTermsAcceptance } from './record-terms-acceptance';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const USER_ID = 'user-1';
const ACCEPTED_AT = new Date('2026-10-21T10:00:00Z');
const ACCEPTED_TERMS_VERSION = '2026-10-21';

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

    await recordTermsAcceptance(USER_ID, ACCEPTED_TERMS_VERSION);

    expect(await readUser()).toMatchObject({
      termsAcceptedAt: ACCEPTED_AT,
      termsVersion: ACCEPTED_TERMS_VERSION,
    });
  });

  it('keeps the first acceptance when called again', async () => {
    vi.useFakeTimers({ now: ACCEPTED_AT });
    await recordTermsAcceptance(USER_ID, ACCEPTED_TERMS_VERSION);
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));

    await recordTermsAcceptance(USER_ID, '2026-11-01');

    expect(await readUser()).toMatchObject({
      termsAcceptedAt: ACCEPTED_AT,
      termsVersion: ACCEPTED_TERMS_VERSION,
    });
  });
});
