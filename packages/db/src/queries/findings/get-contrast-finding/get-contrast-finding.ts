import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { eq } from 'drizzle-orm';

export async function getContrastFinding(
  sha: string,
): Promise<TMaybeUndefined<TFinding>> {
  const db = getDb();

  const [row] = await db
    .select()
    .from(findings)
    .where(eq(findings.dedupeKey, buildContrastDedupeKey(sha)));

  return row;
}
