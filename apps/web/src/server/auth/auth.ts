import 'server-only';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb, schema } from '@blog/db';
import { sendEmail } from '@web/server/email/send-email';
import { env } from '@web/utils/env/env';
import NextAuth from 'next-auth';
import type { EmailConfig } from 'next-auth/providers/email';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { buildMagicLinkEmail } from './magic-link-email';
import { resolveMagicLinkFromAddress } from './magic-link-from-address';

// Verified sending domain once configured in Resend
// (`MAGIC_LINK_FROM_ADDRESS`, e.g. `Sign in <sign-in@{domain}>`),
// falling back to Resend's own shared testing sender otherwise.
const MAGIC_LINK_FROM_ADDRESS = resolveMagicLinkFromAddress(
  env.MAGIC_LINK_FROM_ADDRESS,
);

// Hand-rolled `EmailConfig` instead of `next-auth/providers/nodemailer`'s
// `Nodemailer` factory (CI fix, #1119 follow-up). That factory's *runtime*
// module has a top-level `import { createTransport } from "nodemailer"`
// regardless of whether the transport is ever used — Turbopack resolves it
// at bundle time no matter what, so it required `nodemailer` as a real
// dependency just to satisfy module resolution, which pulled in
// GHSA-p6gq-j5cr-w38f (fixed only in nodemailer@9.0.1, which falls outside
// next-auth@5.0.0-beta.32's `^7.0.7 || ^8.0.5` peer range — no non-vulnerable
// version satisfies both). This codebase never calls nodemailer's
// `createTransport`/`sendMail` (the vulnerable code path) —
// `sendVerificationRequest` below sends through Resend
// (`@web/server/email/send-email`) — so there's no functional loss, only an
// unnecessary dependency. `EmailConfig` (the type, not the deprecated
// `Email` factory) is imported `type`-only from `next-auth/providers/email`,
// which TypeScript/Turbopack strip entirely at compile time — no runtime
// import of that module (or its own nodemailer import) is ever emitted. No
// `server` field is needed since nodemailer's transport is never reached.
const emailProvider: EmailConfig = {
  id: 'email',
  type: 'email',
  name: 'Email',
  from: MAGIC_LINK_FROM_ADDRESS,
  async sendVerificationRequest({ identifier, url }) {
    const { host } = new URL(url);
    const { subject, html } = buildMagicLinkEmail({ url, host });

    await sendEmail({
      to: identifier,
      from: MAGIC_LINK_FROM_ADDRESS,
      subject,
      html,
    });
  },
};

// Config is a function — Auth.js v5's documented "lazy initialization" form
// (see `next-auth`'s own module docstring) — so `DrizzleAdapter(getDb(), …)`,
// and therefore `getDb()`'s `neon(DATABASE_URL)` construction, is deferred to
// the first real request instead of running at module-import time. Without
// this, Next.js's build-time "Collecting page data" step (which imports
// every route module, including this one via
// `src/app/api/auth/[...nextauth]/route.ts`, regardless of whether the route
// is statically rendered) eagerly evaluates the adapter and crashes on a
// `DATABASE_URL` that's legitimately unset in CI's build environment
// (feature-flag-by-absence, same stance as the other auth env vars).
const { handlers, auth } = NextAuth(() => ({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  // Auth.js already defaults `session.strategy` to `"database"` once an
  // `adapter` is set — spelled out explicitly since the Drizzle `sessions`
  // table (`@blog/db`'s schema.ts) only exists to back that strategy.
  session: { strategy: 'database' },
  secret: env.AUTH_SECRET,
  callbacks: {
    // The default database-strategy `session` callback (`@auth/core`'s
    // `defaultCallbacks.session`) only copies `name`/`email`/`image` onto
    // `session.user`, dropping the adapter's own `user.id` — bookmarks
    // (#1109) is the first feature needing a stable id to key a Postgres
    // row by, so it's added back here. `user` (the adapter's row, not the
    // token) is the callback's second argument under the database
    // strategy — see `@auth/core`'s `lib/actions/session.js`.
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
  // Design has no dedicated `/login` route (sign-in is a header popover,
  // `AuthMenu`), so a failed OAuth callback redirects to `/` with `?error=`
  // appended rather than Auth.js's default unstyled `/api/auth/error` page —
  // `useOAuthErrorParam` reads it from there. Not necessarily the *same*
  // article the reader started from (only the success path round-trips
  // there, via the default `redirectTo`) — the header (and its inline error
  // notice) is present on every page regardless.
  pages: { error: '/' },
  providers: [
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    emailProvider,
  ],
}));

// Auth.js's own convention (see `next-auth`'s module docstring): `GET`/`POST`
// are re-exported as-is by `src/app/api/auth/[...nextauth]/route.ts`. `auth`
// is the server-side session reader — bookmarks (#1109) is the first
// consumer, gating `/bookmarks` and its server actions
// (`@web/server/bookmarks/bookmark-actions.ts`); `signIn`/`signOut` still
// have no server-action caller (`AuthMenu` uses the client `next-auth/react`
// versions), so they stay unexported until one exists.
export const { GET, POST } = handlers;
export { auth };
