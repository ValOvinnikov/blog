import * as schema from '@blog/db/schema';
import { insertTestAccount, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getLinkedProviders } from './get-linked-providers';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.accounts);
  await db().delete(schema.users);
});

describe(getLinkedProviders, () => {
  it('reports github and google linked from accounts rows', async () => {
    const user = await insertTestUser(db());
    await insertTestAccount(db(), user.id, 'github');
    await insertTestAccount(db(), user.id, 'google');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: true, google: true, emailLink: false });
  });

  it('reports only the linked provider when just one accounts row exists', async () => {
    const user = await insertTestUser(db());
    await insertTestAccount(db(), user.id, 'github');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: true, google: false, emailLink: false });
  });

  it('reports emailLink linked from emailVerified with zero accounts rows', async () => {
    const user = await insertTestUser(db(), {
      emailVerified: new Date(2026, 0, 1),
    });

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: true });
  });

  it('reports every method as false when nothing is linked', async () => {
    const user = await insertTestUser(db());

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });

  it('reports every method as false for an unrecognized userId', async () => {
    const result = await getLinkedProviders('does-not-exist');

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });

  it("does not report another user's linked accounts", async () => {
    const user = await insertTestUser(db());
    const otherUser = await insertTestUser(db());
    await insertTestAccount(db(), otherUser.id, 'github');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });
});
