import {
  ERROR_CODE,
  FINDING_STATUS,
  type TErrorCode,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findings, type TFinding } from '@blog/db/schema/findings';
import type { TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

// Marks one OPEN finding RESOLVED. A stale id, or one already RESOLVED, is a
// reachable outcome (not a bug) reported as `DB_NOT_FOUND` rather than a throw.
export async function resolveFinding(
  id: string,
): Promise<TResult<TFinding, TErrorCode>> {
  const db = getDb();

  const [resolved] = await db
    .update(findings)
    .set({ status: FINDING_STATUS.RESOLVED, resolvedAt: new Date() })
    .where(and(eq(findings.id, id), eq(findings.status, FINDING_STATUS.OPEN)))
    .returning();

  if (!resolved) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: resolved };
}
