import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { buildContrastDedupeKey } from '@blog/db/queries/findings/contrast-dedupe-key';
import { findings, type TFinding } from '@blog/db/schema/findings';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { eq, sql } from 'drizzle-orm';

export async function tagContrastFinding(
  sha: string,
  tag: string,
): Promise<TResult<TFinding, TErrorCode>> {
  const db = getDb();

  const [tagged] = await db
    .update(findings)
    .set({
      details: sql`coalesce(${findings.details}, '{}'::jsonb) || jsonb_build_object('tag', ${tag}::text)`,
    })
    .where(eq(findings.dedupeKey, buildContrastDedupeKey(sha)))
    .returning();

  if (!tagged) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(tagged);
}
