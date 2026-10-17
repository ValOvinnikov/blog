import {
  FINDING_KIND,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { findings } from '@blog/db/schema/findings';
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
        eq(findings.status, FINDING_STATUS.RESOLVED),
      ),
    )
    .orderBy(desc(findings.lastSeenAt))
    .limit(1);

  return row?.sha;
}
