import 'server-only';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getDb, schema } from '@blog/db';
import { sendEmail } from '@web/server/email/send-email';
import { env } from '@web/utils/env/env';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';

import { buildMagicLinkEmail } from './magic-link-email';

// Resend's own shared testing sender — swap for a verified sending domain
// once this repo configures one in Resend (out of scope for #1107).
const MAGIC_LINK_FROM_ADDRESS = 'Sign in <onboarding@resend.dev>';

const { handlers } = NextAuth({
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
    Nodemailer({
      id: 'email',
      name: 'Email',
      from: MAGIC_LINK_FROM_ADDRESS,
      // `Nodemailer`'s factory throws unless `server` is truthy, but the
      // `sendVerificationRequest` override below never reaches nodemailer's
      // own SMTP transport — it sends through Resend
      // (`@web/server/email/send-email`) instead, so this value is never
      // actually read.
      server: 'smtp://unused',
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
    }),
  ],
});

// Auth.js's own convention (see `next-auth`'s module docstring): re-exported
// as-is by `src/app/api/auth/[...nextauth]/route.ts`. Only `GET`/`POST` are
// exported — `auth`/`signIn`/`signOut` (server-action variants) have no
// caller yet in this issue's scope (no protected routes; `AuthMenu` uses the
// client `next-auth/react` versions instead) — add them here the moment a
// Server Component/action needs one.
export const { GET, POST } = handlers;
