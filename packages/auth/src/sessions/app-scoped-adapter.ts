import type { TAuthApp } from '@blog/config/constants';
import type { Adapter, AdapterSession } from 'next-auth/adapters';

function isIssuedBy(session: AdapterSession, app: TAuthApp): boolean {
  return 'app' in session && session.app === app;
}

export function scopeAdapterToApp(adapter: Adapter, app: TAuthApp): Adapter {
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
}
