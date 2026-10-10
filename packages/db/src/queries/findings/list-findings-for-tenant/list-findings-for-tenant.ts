import type { TFindingStatus } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findingSummaryColumns } from '@blog/db/queries/findings/finding-summary-columns';
import { findings, type TFindingSummary } from '@blog/db/schema/findings';
import { and, desc, eq } from 'drizzle-orm';

export async function listFindingsForTenant(
  tenantId: string,
  status?: TFindingStatus,
): Promise<TFindingSummary[]> {
  const db = getDb();

  return db
    .select(findingSummaryColumns)
    .from(findings)
    .where(
      status
        ? and(eq(findings.tenantId, tenantId), eq(findings.status, status))
        : eq(findings.tenantId, tenantId),
    )
    .orderBy(desc(findings.lastSeenAt));
}
