import type {
  TFindingKind,
  TFindingSeverity,
  TFindingSource,
  TFindingStatus,
} from '@blog/config/constants';
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { tenants } from './tenants';

// `dedupeKey` identifies "the same condition" across sweeps — built by
// `openFinding` from source, kind, tenantId and a caller-supplied
// identifier, never set directly. The partial unique index below allows at
// most one OPEN row per key while leaving past RESOLVED rows with that same
// key as history once a later sweep reopens it.
export const findings = pgTable(
  'findings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, {
      onDelete: 'cascade',
    }),
    source: text('source').notNull().$type<TFindingSource>(),
    kind: text('kind').notNull().$type<TFindingKind>(),
    severity: text('severity').notNull().$type<TFindingSeverity>(),
    status: text('status').notNull().$type<TFindingStatus>(),
    dedupeKey: text('dedupe_key').notNull(),
    details: jsonb('details').$type<Record<string, unknown>>(),
    firstSeenAt: timestamp('first_seen_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { mode: 'date' })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  },
  (finding) => [
    index('findings_tenant_idx').on(finding.tenantId),
    index('findings_status_idx').on(finding.status),
    uniqueIndex('findings_open_dedupe_key_idx')
      .on(finding.dedupeKey)
      .where(sql`${finding.status} = 'OPEN'`),
  ],
);

export type TFinding = typeof findings.$inferSelect;
