import * as schema from '@blog/db/schema';
import {
  GITHUB_PROVIDER,
  GOOGLE_PROVIDER,
} from '@blog/db/testing/account/fixtures';
import {
  insertTestAccount,
  insertTestUser,
  MOCK_EMAIL_VERIFIED_AT,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

import { unlinkProvider } from './unlink-provider';

vi.mock('@blog/db/client');

const UNLINKED = toOutcome('unlinked');
const LAST_METHOD = toOutcome('last-method');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.accounts);
  await db().delete(schema.users);
});

async function findAccount(userId: string, provider: string) {
  return db()
    .select()
    .from(schema.accounts)
    .where(
      and(
        eq(schema.accounts.userId, userId),
        eq(schema.accounts.provider, provider),
      ),
    );
}

describe(unlinkProvider, () => {
  it('deletes github when email-link is also linked', async () => {
    const user = await insertTestUser(db(), {
      emailVerified: MOCK_EMAIL_VERIFIED_AT,
    });
    await insertTestAccount(db(), user.id, GITHUB_PROVIDER);

    const result = await unlinkProvider(user.id, GITHUB_PROVIDER);

    expect(result).toEqual(UNLINKED);
    expect(await findAccount(user.id, GITHUB_PROVIDER)).toEqual([]);
  });

  describe('with a user', () => {
    let user: Awaited<ReturnType<typeof insertTestUser>>;

    beforeEach(async () => {
      user = await insertTestUser(db());
    });

    it('rejects removing the last remaining linked method', async () => {
      await insertTestAccount(db(), user.id, GITHUB_PROVIDER);

      const result = await unlinkProvider(user.id, GITHUB_PROVIDER);

      expect(result).toEqual(LAST_METHOD);
      expect(await findAccount(user.id, GITHUB_PROVIDER)).toHaveLength(1);
    });

    it('is a no-op when the target provider is not linked', async () => {
      await insertTestAccount(db(), user.id, GOOGLE_PROVIDER);

      const result = await unlinkProvider(user.id, GITHUB_PROVIDER);

      expect(result).toEqual(UNLINKED);
      expect(await findAccount(user.id, GOOGLE_PROVIDER)).toHaveLength(1);
    });

    describe('with github and google linked', () => {
      beforeEach(async () => {
        await insertTestAccount(db(), user.id, GITHUB_PROVIDER);
        await insertTestAccount(db(), user.id, GOOGLE_PROVIDER);
      });

      it('deletes the accounts row when a second method remains linked', async () => {
        const result = await unlinkProvider(user.id, GITHUB_PROVIDER);

        expect(result).toEqual(UNLINKED);
        expect(await findAccount(user.id, GITHUB_PROVIDER)).toEqual([]);
      });

      it("does not remove another user's accounts row", async () => {
        const otherUser = await insertTestUser(db());
        await insertTestAccount(db(), otherUser.id, GITHUB_PROVIDER);

        await unlinkProvider(user.id, GITHUB_PROVIDER);

        expect(await findAccount(otherUser.id, GITHUB_PROVIDER)).toHaveLength(
          1,
        );
      });

      it('never lets two concurrent calls remove the last two linked methods', async () => {
        const [githubResult, googleResult] = await Promise.all([
          unlinkProvider(user.id, GITHUB_PROVIDER),
          unlinkProvider(user.id, GOOGLE_PROVIDER),
        ]);

        const remainingAccounts = await db()
          .select()
          .from(schema.accounts)
          .where(eq(schema.accounts.userId, user.id));
        expect([githubResult, googleResult]).toContainEqual(UNLINKED);
        expect([githubResult, googleResult]).toContainEqual(LAST_METHOD);
        expect(remainingAccounts).toHaveLength(1);
      });
    });
  });
});
