import { FINDING_KIND, FINDING_SOURCE } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { contrastHasPassed } from '@shinefold/db/queries/findings/contrast-has-passed';
import { findings } from '@shinefold/db/schema/findings';
import { and, desc, eq, sql } from 'drizzle-orm';

export async function getLatestPassingContrastSha(): Promise<
  TMaybeUndefined<string>
> {
  const db = getDb();

  const [row] = await db
    .select({ sha: sql<string>`${findings.details}->>'sha'` })
    .from(findings)
    .where(
      and(
        eq(findings.source, FINDING_SOURCE.CONTRAST_CHECK),
        eq(findings.kind, FINDING_KIND.CONTRAST_REGRESSION),
        contrastHasPassed,
      ),
    )
    .orderBy(desc(findings.lastSeenAt))
    .limit(1);

  return row?.sha;
}
