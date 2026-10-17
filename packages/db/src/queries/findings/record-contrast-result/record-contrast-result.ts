import {
  CONTRAST_CHECK_OUTCOME,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TContrastResultBody } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { eq, sql } from 'drizzle-orm';

// A passing run is stored RESOLVED rather than skipped, so "green for this
// SHA" stays readable; a re-run refreshes the SHA's one row, keeping any tag.
export async function recordContrastResult(
  result: TContrastResultBody,
): Promise<TFinding> {
  const { sha, outcome } = result;
  const db = getDb();
  const now = new Date();
  const dedupeKey = buildContrastDedupeKey(sha);
  const isPass = outcome === CONTRAST_CHECK_OUTCOME.PASS;
  const status = isPass ? FINDING_STATUS.RESOLVED : FINDING_STATUS.OPEN;
  const resolvedAt = isPass ? now : null;

  const [refreshed] = await db
    .update(findings)
    .set({
      status,
      resolvedAt,
      lastSeenAt: now,
      details: sql`coalesce(${findings.details}, '{}'::jsonb) || ${JSON.stringify(result)}::jsonb`,
    })
    .where(eq(findings.dedupeKey, dedupeKey))
    .returning();

  if (refreshed) {
    return refreshed;
  }

  const [inserted] = await db
    .insert(findings)
    .values({
      source: FINDING_SOURCE.CONTRAST_CHECK,
      kind: FINDING_KIND.CONTRAST_REGRESSION,
      severity: FINDING_SEVERITY.CRITICAL,
      status,
      dedupeKey,
      details: result,
      firstSeenAt: now,
      lastSeenAt: now,
      resolvedAt,
    })
    .returning();

  if (!inserted) {
    throw new Error(
      `recordContrastResult: insert for SHA "${sha}" returned no row.`,
    );
  }

  return inserted;
}
