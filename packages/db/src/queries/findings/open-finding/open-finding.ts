import {
  ERROR_CODE,
  FINDING_STATUS,
  type TErrorCode,
  type TFindingKind,
  type TFindingSeverity,
  type TFindingSource,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { findings, type TFinding } from '@blog/db/schema/findings';
import type { TResult } from '@blog/utils';
import { and, eq, sql } from 'drizzle-orm';

export type TOpenFindingInput = {
  tenantId?: string;
  source: TFindingSource;
  kind: TFindingKind;
  severity: TFindingSeverity;
  identifier: string;
  details?: Record<string, unknown>;
};

export type TOpenFindingResult = {
  finding: TFinding;
  isNewlyOpened: boolean;
};

function buildDedupeKey(
  input: Pick<TOpenFindingInput, 'tenantId' | 'source' | 'kind' | 'identifier'>,
): string {
  return [
    input.source,
    input.kind,
    input.tenantId ?? 'global',
    input.identifier,
  ].join(':');
}

// Opens a finding for a source/kind/tenant/identifier condition, or — if one
// is already OPEN for that same condition — refreshes it in place instead of
// inserting a duplicate. `isNewlyOpened` distinguishes the two outcomes: a
// caller sweeping for a healthy→failing transition acts only when it's
// `true`.
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
    return { ok: true, data: { finding: inserted, isNewlyOpened: true } };
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
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: { finding: updated, isNewlyOpened: false } };
}
