import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getUserByEmail } from './get-user-by-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.users);
});

describe(getUserByEmail, () => {
  it('returns the row for an existing email', async () => {
    await db
      .insert(schema.users)
      .values({ id: 'user-1', email: 'jane@example.com' });

    const result = await getUserByEmail('jane@example.com');

    expect(result).toMatchObject({ id: 'user-1', email: 'jane@example.com' });
  });

  it('matches case-insensitively', async () => {
    await db
      .insert(schema.users)
      .values({ id: 'user-1', email: 'jane@example.com' });

    const result = await getUserByEmail('Jane@Example.com');

    expect(result).toMatchObject({ id: 'user-1' });
  });

  it('matches a differently-cased lookup against a mixed-case stored email', async () => {
    await db
      .insert(schema.users)
      .values({ id: 'user-1', email: 'User@Example.com' });

    const result = await getUserByEmail('user@example.com');

    expect(result).toMatchObject({ id: 'user-1', email: 'User@Example.com' });
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getUserByEmail('missing@example.com');

    expect(result).toBeUndefined();
  });
});
