import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getUserByEmail } from './get-user-by-email';

vi.mock('@blog/db/client');

const MOCK_JANE_EMAIL = 'jane@example.com';
const MOCK_MIXED_CASE_EMAIL = 'User@Example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.users);
});

describe(getUserByEmail, () => {
  describe('with a stored user jane@example.com', () => {
    beforeEach(async () => {
      await db()
        .insert(schema.users)
        .values({ id: 'user-1', email: MOCK_JANE_EMAIL });
    });

    it('returns the row for an existing email', async () => {
      const result = await getUserByEmail(MOCK_JANE_EMAIL);

      expect(result).toMatchObject({ id: 'user-1', email: MOCK_JANE_EMAIL });
    });

    it('matches case-insensitively', async () => {
      const result = await getUserByEmail('Jane@Example.com');

      expect(result).toMatchObject({ id: 'user-1' });
    });
  });

  it('matches a differently-cased lookup against a mixed-case stored email', async () => {
    await db()
      .insert(schema.users)
      .values({ id: 'user-1', email: MOCK_MIXED_CASE_EMAIL });

    const result = await getUserByEmail('user@example.com');

    expect(result).toMatchObject({
      id: 'user-1',
      email: MOCK_MIXED_CASE_EMAIL,
    });
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getUserByEmail('missing@example.com');

    expect(result).toBeUndefined();
  });
});
