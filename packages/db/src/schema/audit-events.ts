import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

// Durable, append-only record of operator-initiated mutations (see
// SPEC.md §17, "Logging is not auditing") — distinct from the structured
// log stream, which never carries business facts. No update or delete query
// is exported for this table anywhere in this package; a correction is a
// new row, never an edit to an existing one.
//
// `action` and `targetType` are plain, free-form `text` rather than a
// `pgEnum` — the set of audited actions and target kinds grows with each
// mutation that starts writing to this table, and a closed enum would force
// a migration for every addition. `targetId` is likewise plain `text`, not
// a Postgres FK: this table describes mutations across several different
// target tables (tenants, admins, memberships, ...), so no single FK target
// applies to every row.
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Nullable, `onDelete: 'set null'` — mirrors `admins.grantedBy`. The actor
  // is always supplied at insert time; nullability only exists so a later
  // account deletion anonymizes the row instead of cascading it away, since
  // deleting a user must never delete the audit history of what they did.
  actorId: text('actor_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export type TAuditEvent = typeof auditEvents.$inferSelect;
