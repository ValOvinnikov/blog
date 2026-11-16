import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { MOCK_USER_EMAIL } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@shinefold/db/testing/retention/fixtures';

import { deleteExpiredVerificationTokens } from './delete-expired-verification-tokens';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

faker.seed(6022);

afterEach(async () => {
  await db().delete(schema.verificationTokens);
});

describe(deleteExpiredVerificationTokens, () => {
  async function insertToken(expires: Date): Promise<string> {
    const token = faker.string.uuid();
    await db()
      .insert(schema.verificationTokens)
      .values({ identifier: MOCK_USER_EMAIL, token, expires });
    return token;
  }

  it('deletes expired sign-in tokens and keeps live ones', async () => {
    await insertToken(justPast(MOCK_RETENTION_NOW));
    const liveToken = await insertToken(justWithin(MOCK_RETENTION_NOW));

    await expect(
      deleteExpiredVerificationTokens(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ token: schema.verificationTokens.token })
      .from(schema.verificationTokens);
    expect(rows).toEqual([{ token: liveToken }]);
  });

  it('deletes at most the given number of tokens per call', async () => {
    await insertToken(justPast(MOCK_RETENTION_NOW));
    await insertToken(justPast(MOCK_RETENTION_NOW));

    await expect(
      deleteExpiredVerificationTokens(MOCK_RETENTION_NOW, 1),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ token: schema.verificationTokens.token })
      .from(schema.verificationTokens);
    expect(rows).toHaveLength(1);
  });

  it('deletes nothing when run a second time', async () => {
    await insertToken(justPast(MOCK_RETENTION_NOW));
    await deleteExpiredVerificationTokens(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );

    await expect(
      deleteExpiredVerificationTokens(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(0);
  });
});
