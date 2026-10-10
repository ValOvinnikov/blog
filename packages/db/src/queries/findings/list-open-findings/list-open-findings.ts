import { FINDING_STATUS } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findingSummaryColumns } from '@blog/db/queries/findings/finding-summary-columns';
import { findings, type TFindingSummary } from '@blog/db/schema/findings';
import { tenants } from '@blog/db/schema/tenants';
import { desc, eq } from 'drizzle-orm';

export type TOpenFinding = TFindingSummary & { tenantName: string | null };

export async function listOpenFindings(): Promise<TOpenFinding[]> {
  const db = getDb();

  return db
    .select({ ...findingSummaryColumns, tenantName: tenants.name })
    .from(findings)
    .leftJoin(tenants, eq(findings.tenantId, tenants.id))
    .where(eq(findings.status, FINDING_STATUS.OPEN))
    .orderBy(desc(findings.lastSeenAt));
}
