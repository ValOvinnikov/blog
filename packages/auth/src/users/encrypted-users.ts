import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

type TEncryptedUser = Pick<TUser, 'emailEncrypted' | 'nameEncrypted'>;

function isEncryptedUser(
  user: AdapterUser,
): user is AdapterUser & TEncryptedUser {
  return 'emailEncrypted' in user && 'nameEncrypted' in user;
}

function decryptUser(
  user: TEncryptedUser & Omit<AdapterUser, 'email'>,
): AdapterUser {
  return { ...user, ...queries.users.readUserPersonalData(user) };
}

function decryptAdapterUser(user: AdapterUser): AdapterUser {
  if (!isEncryptedUser(user)) {
    throw new Error(
      'The adapter returned a user without its encrypted columns.',
    );
  }
  return decryptUser(user);
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
        return decryptAdapterUser(await createUser(withEncrypted));
      }),
    getUser:
      getUser &&
      (async (id) => {
        const user = await getUser(id);
        return user && decryptAdapterUser(user);
      }),
    getUserByEmail: async (email) => {
      const user = await queries.users.getUserByEmailIndex(email);
      return user ? decryptUser(user) : null;
    },
    getUserByAccount:
      getUserByAccount &&
      (async (account) => {
        const user = await getUserByAccount(account);
        return user && decryptAdapterUser(user);
      }),
    updateUser:
      updateUser &&
      (async (user) => {
        const withEncrypted = {
          ...user,
          ...queries.users.userPersonalColumns(user),
        };
        return decryptAdapterUser(await updateUser(withEncrypted));
      }),
    getSessionAndUser:
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sessionToken);
        return found && { ...found, user: decryptAdapterUser(found.user) };
      }),
  };
}
