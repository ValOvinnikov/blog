import { FINDING_STATUS } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { desc, eq } from 'drizzle-orm';

// Every currently OPEN finding across every tenant — the operator
// dashboard's cross-tenant alert list.
export async function listOpenFindings(): Promise<TFinding[]> {
  const db = getDb();

  return db
    .select()
    .from(findings)
    .where(eq(findings.status, FINDING_STATUS.OPEN))
    .orderBy(desc(findings.lastSeenAt));
}
