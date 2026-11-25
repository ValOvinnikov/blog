import * as schema from '@shinefold/db/schema';
import type { TSession } from '@shinefold/db/schema/auth';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const sessionsFaker = createMockFaker(79841);

const MOCK_SESSION_EXPIRES = sessionsFaker.date.future({
  refDate: MOCK_NOW,
});

export async function insertTestSession(
  db: TTestDb,
  userId: string,
  overrides: Partial<typeof schema.sessions.$inferInsert> = {},
): Promise<TSession> {
  return firstRowOrThrow(
    await db
      .insert(schema.sessions)
      .values({
        sessionToken: crypto.randomUUID(),
        userId,
        expires: MOCK_SESSION_EXPIRES,
        ...overrides,
      })
      .returning(),
    'insertTestSession',
  );
}
