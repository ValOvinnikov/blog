import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getUserByEmail } from './get-user-by-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const MOCK_UPPER_CASE_EMAIL = MOCK_USER_EMAIL.toUpperCase();

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmail, () => {
  it.each([
    {
      title: 'returns the row for an existing email',
      storedEmail: MOCK_USER_EMAIL,
      requestedEmail: MOCK_USER_EMAIL,
    },
    {
      title: 'matches a differently-cased lookup',
      storedEmail: MOCK_USER_EMAIL,
      requestedEmail: MOCK_UPPER_CASE_EMAIL,
    },
    {
      title: 'matches against a mixed-case stored email',
      storedEmail: MOCK_UPPER_CASE_EMAIL,
      requestedEmail: MOCK_USER_EMAIL,
    },
  ])('$title', async ({ storedEmail, requestedEmail }) => {
    const user = await insertTestUser(db(), { email: storedEmail });

    const result = await getUserByEmail(requestedEmail);

    expect(result).toEqual(user);
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getUserByEmail(MOCK_USER_EMAIL);

    expect(result).toBeUndefined();
  });
});
