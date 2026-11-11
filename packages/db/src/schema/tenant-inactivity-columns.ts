import type { TSuspensionReason } from '@blog/db/constants';
import { text, timestamp } from 'drizzle-orm/pg-core';

export const tenantInactivityColumns = {
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
  inactivityWarnedAt: timestamp('inactivity_warned_at'),
  suspendedAt: timestamp('suspended_at'),
  deletionNotifiedAt: timestamp('deletion_notified_at'),
  suspensionReason: text('suspension_reason').$type<TSuspensionReason>(),
};
