import { queries } from '@blog/db';
import type { TUser } from '@blog/db/schema/auth';
import type { Adapter, AdapterUser } from 'next-auth/adapters';

type TStoredUser = Omit<AdapterUser, 'email'> & {
  email?: TUser['email'];
} & Partial<Pick<TUser, 'emailEncrypted' | 'nameEncrypted'>>;

function toStoredColumns<TWrite extends Partial<AdapterUser>>({
  email,
  name,
  ...user
}: TWrite) {
  return { ...user, ...queries.users.userPersonalColumns({ email, name }) };
}

function decryptUser({
  id,
  emailVerified,
  image,
  emailEncrypted,
  nameEncrypted,
}: TStoredUser): AdapterUser {
  return {
    id,
    emailVerified,
    image,
    ...queries.users.readUserPersonalData({ emailEncrypted, nameEncrypted }),
  };
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
      (async (user) =>
        decryptUser(
          // Auth.js types the write as a full user, but the plain email and name are never stored.
          await createUser(toStoredColumns(user) as AdapterUser),
        )),
    getUser:
      getUser &&
      (async (id) => {
        const user = await getUser(id);
        return user && decryptUser(user);
      }),
    getUserByEmail: async (email) => {
      const user = await queries.users.findUserByEmail(email);
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
      (async (user) => decryptUser(await updateUser(toStoredColumns(user)))),
    getSessionAndUser:
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sessionToken);
        return found && { ...found, user: decryptUser(found.user) };
      }),
  };
}
