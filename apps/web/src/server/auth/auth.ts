import 'server-only';

import { buildAuthConfig } from '@blog/auth';
import { sendEmail } from '@web/server/email/send-email';
import NextAuth from 'next-auth';

// Config is a function — Auth.js v5's documented "lazy initialization" form
// (see `next-auth`'s own module docstring) — so `buildAuthConfig`'s
// `DrizzleAdapter(getDb(), …)`, and therefore `getDb()`'s
// `neon(DATABASE_URL)` construction, is deferred to the first real request
// instead of running at module-import time. Without this, Next.js's
// build-time "Collecting page data" step (which imports every route module,
// including this one via `src/app/api/auth/[...nextauth]/route.ts`,
// regardless of whether the route is statically rendered) eagerly evaluates
// the adapter and crashes on a `DATABASE_URL` that's legitimately unset in
// CI's build environment (feature-flag-by-absence, same stance as the other
// auth env vars).
const { handlers, auth } = NextAuth(() => ({
  ...buildAuthConfig({ sendEmail }),
  // Design has no dedicated `/login` route (sign-in is a header popover,
  // `AuthMenu`), so a failed OAuth callback redirects to `/` with `?error=`
  // appended rather than Auth.js's default unstyled `/api/auth/error` page —
  // `useOAuthErrorParam` reads it from there. Not necessarily the *same*
  // article the reader started from (only the success path round-trips
  // there, via the default `redirectTo`) — the header (and its inline error
  // notice) is present on every page regardless. Web-owned: it names a route
  // only this app has.
  pages: { error: '/' },
}));

// Auth.js's own convention (see `next-auth`'s module docstring): `GET`/`POST`
// are re-exported as-is by `src/app/api/auth/[...nextauth]/route.ts`. `auth`
// is the server-side session reader, gating `/bookmarks` and its server
// actions (`@web/server/bookmarks/bookmark-actions.ts`); `signIn`/`signOut`
// still have no server-action caller (`AuthMenu` uses the client
// `next-auth/react` versions), so they stay unexported until one exists.
export const { GET, POST } = handlers;
export { auth };
