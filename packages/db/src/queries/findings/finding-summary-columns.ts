import { findings } from '@blog/db/schema/findings';
import { isNotNull } from 'drizzle-orm';

export const findingSummaryColumns = {
  id: findings.id,
  tenantId: findings.tenantId,
  source: findings.source,
  kind: findings.kind,
  severity: findings.severity,
  status: findings.status,
  dedupeKey: findings.dedupeKey,
  firstSeenAt: findings.firstSeenAt,
  lastSeenAt: findings.lastSeenAt,
  resolvedAt: findings.resolvedAt,
  hasDetails: isNotNull(findings.details).mapWith(Boolean),
};
