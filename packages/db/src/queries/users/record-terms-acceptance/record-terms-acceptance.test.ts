import { TERMS_VERSION } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import type { TUser } from '@blog/db/schema/auth';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { recordTermsAcceptance } from './record-terms-acceptance';

vi.mock('@blog/db/client');

faker.seed(6022);

const db = useQueryTestDb();

const MOCK_ACCEPTED_AT = new Date('2026-10-20T09:00:00Z');
const MOCK_LATER_ACCEPTED_AT = new Date('2026-11-01T10:00:00Z');
const MOCK_OTHER_TERMS_VERSION = faker.system.semver();

async function readUser(userId: string) {
  const [user] = await db()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  return user;
}

describe(recordTermsAcceptance, () => {
  let user: TUser;

  beforeEach(async () => {
    vi.useFakeTimers({ now: MOCK_ACCEPTED_AT });
    user = await insertTestUser(db());
  });

  afterEach(async () => {
    vi.useRealTimers();
    await db().delete(schema.users);
  });

  it('stamps the acceptance time and version on the user', async () => {
    await recordTermsAcceptance(user.id, TERMS_VERSION);

    const stored = await readUser(user.id);

    expect(stored).toEqual({
      ...user,
      termsAcceptedAt: MOCK_ACCEPTED_AT,
      termsVersion: TERMS_VERSION,
    });
  });

  it('keeps the first acceptance when called again', async () => {
    await recordTermsAcceptance(user.id, TERMS_VERSION);
    vi.setSystemTime(MOCK_LATER_ACCEPTED_AT);

    await recordTermsAcceptance(user.id, MOCK_OTHER_TERMS_VERSION);

    const stored = await readUser(user.id);

    expect(stored).toEqual({
      ...user,
      termsAcceptedAt: MOCK_ACCEPTED_AT,
      termsVersion: TERMS_VERSION,
    });
  });
});
