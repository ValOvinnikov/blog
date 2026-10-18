import { FINDING_SOURCE, FINDING_STATUS } from '@blog/config/constants';
import type { TContrastResultBody, TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { findingSummaryColumns } from '@blog/db/queries/findings/finding-summary-columns';
import { findings, type TFindingSummary } from '@blog/db/schema/findings';
import { tenants } from '@blog/db/schema/tenants';
import { desc, eq, sql } from 'drizzle-orm';

export type TOpenFinding = TFindingSummary & {
  tenantName: TMaybeNull<string>;
  contrastResult: TMaybeNull<TContrastResultBody>;
};

export async function listOpenFindings(): Promise<TOpenFinding[]> {
  const db = getDb();

  return db
    .select({
      ...findingSummaryColumns,
      tenantName: tenants.name,
      contrastResult: sql<
        TMaybeNull<TContrastResultBody>
      >`case when ${findings.source} = ${FINDING_SOURCE.CONTRAST_CHECK} then ${findings.details} end`,
    })
    .from(findings)
    .leftJoin(tenants, eq(findings.tenantId, tenants.id))
    .where(eq(findings.status, FINDING_STATUS.OPEN))
    .orderBy(desc(findings.lastSeenAt));
}
