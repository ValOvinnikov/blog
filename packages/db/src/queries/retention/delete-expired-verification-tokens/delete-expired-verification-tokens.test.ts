import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';

import { deleteExpiredVerificationTokens } from './delete-expired-verification-tokens';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.verificationTokens);
});

describe(deleteExpiredVerificationTokens, () => {
  async function insertToken(expires: Date): Promise<string> {
    const token = crypto.randomUUID();
    await db()
      .insert(schema.verificationTokens)
      .values({ identifier: MOCK_USER_EMAIL, token, expires });
    return token;
  }

  it('deletes expired sign-in tokens and keeps live ones', async () => {
    await insertToken(justPast(MOCK_RETENTION_NOW));
    const liveToken = await insertToken(justWithin(MOCK_RETENTION_NOW));

    await expect(
      deleteExpiredVerificationTokens(MOCK_RETENTION_NOW),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ token: schema.verificationTokens.token })
      .from(schema.verificationTokens);
    expect(rows).toEqual([{ token: liveToken }]);
  });

  it('deletes nothing when run a second time', async () => {
    await insertToken(justPast(MOCK_RETENTION_NOW));
    await deleteExpiredVerificationTokens(MOCK_RETENTION_NOW);

    await expect(
      deleteExpiredVerificationTokens(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
  });
});
