import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { buildContrastDedupeKey } from '@shinefold/db/queries/findings/contrast-dedupe-key';
import { contrastHasPassed } from '@shinefold/db/queries/findings/contrast-has-passed';
import { findings, type TFinding } from '@shinefold/db/schema/findings';
import { eq, getTableColumns } from 'drizzle-orm';

export type TContrastFinding = TFinding & { hasPassed: boolean };

export async function getContrastFinding(
  sha: string,
): Promise<TMaybeUndefined<TContrastFinding>> {
  const db = getDb();

  const [row] = await db
    .select({ ...getTableColumns(findings), hasPassed: contrastHasPassed })
    .from(findings)
    .where(eq(findings.dedupeKey, buildContrastDedupeKey(sha)));

  return row;
}
