import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Auth.js (NextAuth v5) Drizzle adapter tables — the exact column shape
// `@auth/drizzle-adapter`'s Postgres adapter (`PostgresDrizzleAdapter`)
// requires at runtime (verified against its `src/lib/pg.ts` `defineTables`
// default schema, package v1.11.3). #1107 (web) wires the adapter itself,
// passing this schema in (`DrizzleAdapter(db, { usersTable: schema.users,
// accountsTable: schema.accounts, sessionsTable: schema.sessions,
// verificationTokensTable: schema.verificationTokens })`) — column names are
// load-bearing (the adapter reads them by these exact keys), so they are not
// renamed/reshaped to this repo's usual conventions.
//
// `authenticator` (WebAuthn/passkey) is intentionally omitted — M5.1 (#1039,
// D13) ships exactly three sign-in methods (GitHub, Google, email magic
// link), none of which need it.
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// Required by Auth.js's Email provider (the magic-link sign-in method, D13)
// — it stores/verifies the one-time sign-in token here.
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export type TUser = typeof users.$inferSelect;
export type TAccount = typeof accounts.$inferSelect;
export type TSession = typeof sessions.$inferSelect;
export type TVerificationToken = typeof verificationTokens.$inferSelect;
