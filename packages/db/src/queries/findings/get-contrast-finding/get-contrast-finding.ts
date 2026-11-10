import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { contrastHasPassed } from '@blog/db/queries/findings/contrast-has-passed';
import { findings, type TFinding } from '@blog/db/schema/findings';
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
