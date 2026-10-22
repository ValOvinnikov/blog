import { getDb } from '@blog/db/client';
import { count, getTableName } from 'drizzle-orm';

import { PERSONAL_DATA_TARGETS, targetGap } from './personal-data-targets';

export type TPersonalDataCounts = Record<string, number>;

export async function countPersonalDataGaps(): Promise<TPersonalDataCounts> {
  const db = getDb();

  const entries = await Promise.all(
    PERSONAL_DATA_TARGETS.map(async (target) => {
      const [row] = await db
        .select({ total: count() })
        .from(target.table)
        .where(targetGap(target));

      return [getTableName(target.table), row?.total ?? 0] as const;
    }),
  );

  return Object.fromEntries(entries);
}
