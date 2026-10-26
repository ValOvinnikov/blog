import type { TValueOf } from '@blog/config/utils';

export const RETENTION_KIND = {
  PENDING_SUBSCRIBERS: 'PENDING_SUBSCRIBERS',
  LEADS: 'LEADS',
  SESSIONS: 'SESSIONS',
  VERIFICATION_TOKENS: 'VERIFICATION_TOKENS',
  AUDIT_EVENTS: 'AUDIT_EVENTS',
  RESOLVED_FINDINGS: 'RESOLVED_FINDINGS',
} as const;
export type TRetentionKind = TValueOf<typeof RETENTION_KIND>;

export const RETENTION_LOG = {
  DELETED: 'retention.deleted',
  CLEANUP_FAILED: 'retention.cleanup_failed',
  DEADLINE_REACHED: 'retention.deadline_reached',
} as const;

export const RETENTION_DELETE_BATCH_SIZE = 1000;

// Measured from the sweep's start, leaving a minute of the route's 300s maxDuration for the batch in flight.
export const RETENTION_RUN_DEADLINE_MS = 240_000;
