import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

type TStoredUser = Omit<AdapterUser, 'email'> &
  Partial<Pick<TUser, 'emailEncrypted' | 'nameEncrypted'>>;

function decryptUser(user: TStoredUser): AdapterUser {
  return { ...user, ...queries.users.readUserPersonalData(user) };
}

export function withEncryptedUsers(adapter: Adapter): Adapter {
  const {
    createUser,
    getUser,
    getUserByAccount,
    updateUser,
    getSessionAndUser,
  } = adapter;

  return {
    ...adapter,
    createUser:
      createUser &&
      (async (user) => {
        const withEncrypted = {
          ...user,
          ...queries.users.userPersonalColumns(user),
        };
        return decryptUser(await createUser(withEncrypted));
      }),
    getUser:
      getUser &&
      (async (id) => {
        const user = await getUser(id);
        return user && decryptUser(user);
      }),
    getUserByEmail: async (email) => {
      const user = await queries.users.getUserByEmailIndex(email);
      return user ? decryptUser(user) : null;
    },
    getUserByAccount:
      getUserByAccount &&
      (async (account) => {
        const user = await getUserByAccount(account);
        return user && decryptUser(user);
      }),
    updateUser:
      updateUser &&
      (async (user) => {
        const withEncrypted = {
          ...user,
          ...queries.users.userPersonalColumns(user),
        };
        return decryptUser(await updateUser(withEncrypted));
      }),
    getSessionAndUser:
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sessionToken);
        return found && { ...found, user: decryptUser(found.user) };
      }),
  };
}
