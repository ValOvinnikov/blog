import type { TAuthApp } from '@blog/config/constants';
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
} from 'next-auth/adapters';

function isIssuedBy(session: AdapterSession, app: TAuthApp): boolean {
  return 'app' in session && session.app === app;
}

// Nothing calls a provider on the user's behalf, so its tokens are never stored.
function withoutProviderTokens(account: AdapterAccount): AdapterAccount {
  return {
    ...account,
    access_token: undefined,
    refresh_token: undefined,
    id_token: undefined,
  };
}

export function scopeAdapterToApp(adapter: Adapter, app: TAuthApp): Adapter {
  const { createSession, getSessionAndUser, deleteSession, linkAccount } =
    adapter;

  return {
    ...adapter,
    createSession:
      createSession &&
      ((session) => {
        // The Drizzle adapter inserts every field it is given, so `app` reaches the row.
        const stamped = { ...session, app };
        return createSession(stamped);
      }),
    linkAccount:
      linkAccount && ((account) => linkAccount(withoutProviderTokens(account))),
    getSessionAndUser:
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sessionToken);
        return found && isIssuedBy(found.session, app) ? found : null;
      }),
    deleteSession:
      deleteSession &&
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sessionToken);
        if (found && isIssuedBy(found.session, app)) {
          await deleteSession(sessionToken);
        }
      }),
  };
}
