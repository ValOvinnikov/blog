import {
  ERROR_CODE,
  FINDING_STATUS,
  type TErrorCode,
  type TFindingSeverity,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  buildDedupeKey,
  type TDedupeKeyParts,
} from '@blog/db/queries/findings/build-dedupe-key';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, sql } from 'drizzle-orm';

export type TOpenFindingInput = TDedupeKeyParts & {
  severity: TFindingSeverity;
  details?: Record<string, unknown>;
};

export type TOpenFindingResult = {
  finding: TFinding;
  isNewlyOpened: boolean;
};

export async function openFinding(
  input: TOpenFindingInput,
): Promise<TResult<TOpenFindingResult, TErrorCode>> {
  const db = getDb();
  const now = new Date();
  const dedupeKey = buildDedupeKey(input);

  const [inserted] = await db
    .insert(findings)
    .values({
      tenantId: input.tenantId,
      source: input.source,
      kind: input.kind,
      severity: input.severity,
      status: FINDING_STATUS.OPEN,
      dedupeKey,
      details: input.details,
      firstSeenAt: now,
      lastSeenAt: now,
    })
    .onConflictDoNothing({
      target: findings.dedupeKey,
      where: sql`${findings.status} = 'OPEN'`,
    })
    .returning();

  if (inserted) {
    return okResult({ finding: inserted, isNewlyOpened: true });
  }

  const [updated] = await db
    .update(findings)
    .set({ lastSeenAt: now, severity: input.severity, details: input.details })
    .where(
      and(
        eq(findings.dedupeKey, dedupeKey),
        eq(findings.status, FINDING_STATUS.OPEN),
      ),
    )
    .returning();

  if (!updated) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult({ finding: updated, isNewlyOpened: false });
}
