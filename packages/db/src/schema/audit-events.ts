import type { TAuditAction, TAuditTargetType } from '@blog/config/constants';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { CREATED_AT_COLUMN } from './columns';

// `action`/`targetType` are plain `text`, not `pgEnum` — a new audited
// action or target type never forces a migration this way — but stay bound
// to `@blog/config`'s closed unions via `.$type<>()`. `targetId` has no
// Postgres FK: rows span several target tables (tenants, domains, site
// config, ...), so no single FK target applies to every row.
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull().$type<TAuditAction>(),
    targetType: text('target_type').notNull().$type<TAuditTargetType>(),
    targetId: text('target_id').notNull(),
    details: jsonb('details').$type<Record<string, unknown>>(),
    createdAt: timestamp(CREATED_AT_COLUMN, { mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  // Unlike this package's other tables, this one is append-only and
  // unbounded — "every event for target X" is the obvious query, so it
  // gets the index other, bounded reference tables here don't need.
  (auditEvent) => [
    index('audit_events_target_idx').on(
      auditEvent.targetType,
      auditEvent.targetId,
    ),
  ],
);

export type TAuditEvent = typeof auditEvents.$inferSelect;
