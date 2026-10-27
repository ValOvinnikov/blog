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
import { faker } from '@faker-js/faker';

import { getLinkedProviders } from './get-linked-providers';

vi.mock('@blog/db/client');

faker.seed(602203);

const MOCK_UNKNOWN_USER_ID = faker.string.uuid();

const NOTHING_LINKED = { github: false, google: false, emailLink: false };

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.accounts);
  await db().delete(schema.users);
});

describe(getLinkedProviders, () => {
  it('reports every method as false for an unrecognized userId', async () => {
    const result = await getLinkedProviders(MOCK_UNKNOWN_USER_ID);

    expect(result).toEqual(NOTHING_LINKED);
  });

  describe('with a user', () => {
    let user: Awaited<ReturnType<typeof insertTestUser>>;

    beforeEach(async () => {
      user = await insertTestUser(db());
    });

    it('reports emailLink linked from emailVerified with zero accounts rows', async () => {
      const verifiedUser = await insertTestUser(db(), {
        emailVerified: MOCK_EMAIL_VERIFIED_AT,
      });

      const result = await getLinkedProviders(verifiedUser.id);

      expect(result).toEqual({ ...NOTHING_LINKED, emailLink: true });
    });

    it.each([
      {
        title: 'github and google',
        providers: [GITHUB_PROVIDER, GOOGLE_PROVIDER],
        expected: { ...NOTHING_LINKED, github: true, google: true },
      },
      {
        title: 'only github',
        providers: [GITHUB_PROVIDER],
        expected: { ...NOTHING_LINKED, github: true },
      },
      { title: 'nothing', providers: [], expected: NOTHING_LINKED },
    ])(
      'reports $title linked from the accounts rows',
      async ({ providers, expected }) => {
        for (const provider of providers) {
          await insertTestAccount(db(), user.id, provider);
        }

        const result = await getLinkedProviders(user.id);

        expect(result).toEqual(expected);
      },
    );

    it("does not report another user's linked accounts", async () => {
      const otherUser = await insertTestUser(db());
      await insertTestAccount(db(), otherUser.id, GITHUB_PROVIDER);

      const result = await getLinkedProviders(user.id);

      expect(result).toEqual(NOTHING_LINKED);
    });
  });
});
