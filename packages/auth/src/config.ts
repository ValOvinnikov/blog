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
 * buildAuthConfig — the Auth.js configuration both apps pass to their own
 * `NextAuth()` call: the Drizzle adapter over `@blog/db`'s tables, the
 * `database` session strategy (and the `session.user.id` it exposes), and
 * the GitHub/Google/magic-link providers, identically for both. Returned
 * from a function — not a plain object — so each app can keep using Auth.js
 * v5's lazy-initialization form (`NextAuth(() => buildAuthConfig(...))`),
 * deferring `getDb()`'s Neon connection until the first real request instead
 * of constructing it at module-import time (which would otherwise crash a
 * build environment with no `DATABASE_URL` set).
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
      GitHub({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
      }),
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
      buildMagicLinkProvider(sendEmail),
    ],
  };
}
