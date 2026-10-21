import type { TAuthApp } from '@blog/config/constants';
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
} from 'next-auth/adapters';

type TAdapterWrapper = (adapter: Adapter) => Adapter;

function isIssuedBy(session: AdapterSession, app: TAuthApp): boolean {
  return 'app' in session && session.app === app;
}

function stripProviderTokens(account: AdapterAccount): AdapterAccount {
  return {
    ...account,
    access_token: undefined,
    refresh_token: undefined,
    id_token: undefined,
  };
}

// Nothing calls a provider on the user's behalf, so its tokens are never stored.
function withoutProviderTokens(adapter: Adapter): Adapter {
  const { linkAccount } = adapter;

  return {
    ...adapter,
    linkAccount:
      linkAccount && ((account) => linkAccount(stripProviderTokens(account))),
  };
}

function withAppScopedSessions(app: TAuthApp): TAdapterWrapper {
  return (adapter) => {
    const { createSession, getSessionAndUser, deleteSession } = adapter;

    return {
      ...adapter,
      createSession:
        createSession &&
        ((session) => {
          // The Drizzle adapter inserts every field it is given, so `app` reaches the row.
          const stamped = { ...session, app };
          return createSession(stamped);
        }),
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
  };
}

export function scopeAdapterToApp(adapter: Adapter, app: TAuthApp): Adapter {
  const wrappers: TAdapterWrapper[] = [
    withoutProviderTokens,
    withAppScopedSessions(app),
  ];

  return wrappers.reduce((wrapped, wrap) => wrap(wrapped), adapter);
}
