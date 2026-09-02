import type { TFindingStatus } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { and, desc, eq } from 'drizzle-orm';

// Every finding recorded for one tenant, most recently seen first, optionally
// narrowed to OPEN or RESOLVED.
export async function listFindingsForTenant(
  tenantId: string,
  status?: TFindingStatus,
): Promise<TFinding[]> {
  const db = getDb();

  return db
    .select()
    .from(findings)
    .where(
      status
        ? and(eq(findings.tenantId, tenantId), eq(findings.status, status))
        : eq(findings.tenantId, tenantId),
    )
    .orderBy(desc(findings.lastSeenAt));
}
