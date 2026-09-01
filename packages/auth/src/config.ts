import 'server-only';

import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { consumePendingInvitesOnSignIn } from '@blog/auth/events/consume-pending-invites-on-sign-in';
import {
  buildMagicLinkProvider,
  type TSendEmail,
} from '@blog/auth/providers/magic-link/magic-link-provider';
import { env } from '@blog/auth/utils/env/env';
import { getDb, schema } from '@blog/db';
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export type TBuildAuthConfigOptions = {
  /**
   * Delivers the magic-link sign-in email. Injected rather than owned here:
   * this package's dependency contract has no room for an email-sending SDK,
   * so each app supplies its own already-configured sender (e.g. a Resend
   * client) with the same `{ to, from, subject, html }` shape.
   */
  sendEmail: TSendEmail;
};

/**
 * Builds the Auth.js configuration both apps pass to their own `NextAuth()` call.
 */
export function buildAuthConfig({
  sendEmail,
}: TBuildAuthConfigOptions): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(getDb(), {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    // Auth.js already defaults `session.strategy` to `"database"` once an
    // `adapter` is set — spelled out explicitly since the Drizzle `sessions`
    // table (`@blog/db`'s schema) only exists to back that strategy.
    session: { strategy: 'database' },
    secret: env.AUTH_SECRET,
    // Unset (the default), Auth.js picks its own per-origin cookie — each app
    // gets its own session. Set, both apps must be subdomains of that domain
    // for the browser to accept it; scoping the cookie there is what makes one
    // sign-in cover both. Overriding `sessionToken` means we now own its name
    // and every option Auth.js would otherwise derive (see `defaultCookies` in
    // `@auth/core`), not just `domain` — reproduced here rather than changed.
    ...(env.AUTH_COOKIE_DOMAIN && {
      cookies: {
        sessionToken: {
          name: '__Secure-authjs.session-token',
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure: true,
            domain: env.AUTH_COOKIE_DOMAIN,
          },
        },
      },
    }),
    callbacks: {
      // The default database-strategy `session` callback (`@auth/core`'s
      // `defaultCallbacks.session`) only copies `name`/`email`/`image` onto
      // `session.user`, dropping the adapter's own `user.id`. Both apps key
      // their own authorization lookups (bookmarks, `admins`/`memberships`
      // rows) off a stable user id, so this is shared rather than left for
      // each app to reimplement. `user` (the adapter's row, not the token)
      // is the callback's second argument under the database strategy — see
      // `@auth/core`'s `lib/actions/session.js`.
      session: ({ session, user }) => ({
        ...session,
        user: { ...session.user, id: user.id },
      }),
    },
    events: {
      signIn: ({ user }) => consumePendingInvitesOnSignIn({ user }),
    },
    providers: [
      ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
        ? [
            GitHub({
              clientId: env.AUTH_GITHUB_ID,
              clientSecret: env.AUTH_GITHUB_SECRET,
            }),
          ]
        : []),
      ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
        ? [
            Google({
              clientId: env.AUTH_GOOGLE_ID,
              clientSecret: env.AUTH_GOOGLE_SECRET,
            }),
          ]
        : []),
      buildMagicLinkProvider(sendEmail),
    ],
  };
}
