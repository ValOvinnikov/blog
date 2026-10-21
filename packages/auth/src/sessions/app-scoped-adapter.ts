import type { TAuthApp } from '@blog/config/constants';
import { sha256Hex } from '@blog/utils/hash';
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
  const {
    createSession,
    getSessionAndUser,
    updateSession,
    deleteSession,
    linkAccount,
  } = adapter;

  return {
    ...adapter,
    createSession:
      createSession &&
      (async (session) => {
        // The Drizzle adapter inserts every field it is given, so `app` reaches the row.
        const created = await createSession({
          ...session,
          sessionToken: sha256Hex(session.sessionToken),
          app,
        });
        // Auth.js sets the cookie from the returned token, so it must be the raw one.
        return { ...created, sessionToken: session.sessionToken };
      }),
    linkAccount:
      linkAccount && ((account) => linkAccount(withoutProviderTokens(account))),
    getSessionAndUser:
      getSessionAndUser &&
      (async (sessionToken) => {
        const found = await getSessionAndUser(sha256Hex(sessionToken));
        return found && isIssuedBy(found.session, app) ? found : null;
      }),
    updateSession:
      updateSession &&
      ((session) =>
        updateSession({
          ...session,
          sessionToken: sha256Hex(session.sessionToken),
        })),
    deleteSession:
      deleteSession &&
      getSessionAndUser &&
      (async (sessionToken) => {
        const tokenHash = sha256Hex(sessionToken);
        const found = await getSessionAndUser(tokenHash);
        if (found && isIssuedBy(found.session, app)) {
          await deleteSession(tokenHash);
        }
      }),
  };
}
