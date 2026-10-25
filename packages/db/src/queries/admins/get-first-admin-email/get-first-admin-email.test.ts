import type { TValueOf } from '@blog/config/utils';
import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getFirstAdminEmail } from './get-first-admin-email';

vi.mock('@blog/db/client');

const MOCK_FIRST_USER_ID = 'user-1';
const MOCK_SECOND_USER_ID = 'user-2';
const MOCK_JANUARY = new Date('2026-01-01T00:00:00Z');
const MOCK_FEBRUARY = new Date('2026-02-01T00:00:00Z');
const MOCK_MODERATOR_EMAIL = 'moderator@example.com';

const db = useQueryTestDb();

async function insertAdmin(
  userId: string,
  createdAt: Date,
  role: TValueOf<typeof ADMIN_ROLE> = ADMIN_ROLE.SUPERADMIN,
): Promise<void> {
  await db().insert(schema.admins).values({
    userId,
    role,
    grantedVia: GRANTED_VIA.BREAK_GLASS,
    createdAt,
  });
}

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(getFirstAdminEmail, () => {
  it('returns the email of the earliest-created admin row', async () => {
    const firstEmail = 'first@example.com';
    await insertTestUser(db(), {
      id: MOCK_FIRST_USER_ID,
      email: firstEmail,
    });
    await insertTestUser(db(), {
      id: MOCK_SECOND_USER_ID,
      email: 'second@example.com',
    });
    await insertAdmin(MOCK_FIRST_USER_ID, MOCK_JANUARY);
    await insertAdmin(MOCK_SECOND_USER_ID, MOCK_FEBRUARY);

    const result = await getFirstAdminEmail();

    expect(result).toBe(firstEmail);
  });

  it('ignores insertion order and only orders by createdAt', async () => {
    const earlierEmail = 'earlier@example.com';
    await insertTestUser(db(), {
      id: MOCK_FIRST_USER_ID,
      email: 'later@example.com',
    });
    await insertTestUser(db(), {
      id: MOCK_SECOND_USER_ID,
      email: earlierEmail,
    });
    await insertAdmin(MOCK_FIRST_USER_ID, new Date('2026-03-01T00:00:00Z'));
    await insertAdmin(MOCK_SECOND_USER_ID, new Date('2026-01-15T00:00:00Z'));

    const result = await getFirstAdminEmail();

    expect(result).toBe(earlierEmail);
  });

  it('returns undefined when there are no admins rows at all', async () => {
    const result = await getFirstAdminEmail();

    expect(result).toBeUndefined();
  });

  it('returns undefined when the earliest admin has no email on file', async () => {
    await insertTestUser(db(), { id: MOCK_FIRST_USER_ID, email: null });
    await insertAdmin(MOCK_FIRST_USER_ID, MOCK_JANUARY);

    const result = await getFirstAdminEmail();

    expect(result).toBeUndefined();
  });

  it('is not filtered by role — the earliest row wins regardless of its role value', async () => {
    await insertTestUser(db(), {
      id: MOCK_FIRST_USER_ID,
      email: MOCK_MODERATOR_EMAIL,
    });
    await insertTestUser(db(), {
      id: MOCK_SECOND_USER_ID,
      email: 'superadmin@example.com',
    });
    await insertAdmin(MOCK_FIRST_USER_ID, MOCK_JANUARY, ADMIN_ROLE.MODERATOR);
    await insertAdmin(
      MOCK_SECOND_USER_ID,
      MOCK_FEBRUARY,
      ADMIN_ROLE.SUPERADMIN,
    );

    const result = await getFirstAdminEmail();

    expect(result).toBe(MOCK_MODERATOR_EMAIL);
  });
});
