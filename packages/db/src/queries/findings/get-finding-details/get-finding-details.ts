import { getDb } from '@shinefold/db/client';
import { findings, type TFinding } from '@shinefold/db/schema/findings';
import { and, eq } from 'drizzle-orm';

export async function getFindingDetails(
  tenantId: string,
  findingId: string,
): Promise<TFinding['details']> {
  const db = getDb();

  const [row] = await db
    .select({ details: findings.details })
    .from(findings)
    .where(and(eq(findings.id, findingId), eq(findings.tenantId, tenantId)));

  return row?.details ?? null;
}
