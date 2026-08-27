/**
 * Storybook-only stand-in for the real `auth()` export, whose module calls
 * `NextAuth(...)` at import time (`server-only`-guarded) — pulling that into
 * a browser bundle throws immediately. Aliased in via `.storybook/main.ts`
 * for any story whose composed markup imports a section wrapper's barrel
 * alongside its pure view (e.g. `AccountPageView`'s fixtures).
 */
export const auth = async () => null;
