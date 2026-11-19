import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { hasArrayGotMultipleItems } from '@shinefold/utils/primitives';
import { inArray, type SQL, type SQLWrapper, sql } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

type TBatchKey = readonly [PgColumn, ...PgColumn[]];

// `IN (subquery)` plans a full-table hash join on every batch; `= ANY(ARRAY(…))` probes the primary key.
function isInBatch(key: SQLWrapper, batch: SQLWrapper): SQL {
  return sql`${key} = any(array(${batch}))`;
}

function matchesBatch(keys: TBatchKey, batch: SQLWrapper): SQL {
  if (hasArrayGotMultipleItems(keys)) {
    return inArray(sql`(${sql.join([...keys], sql`, `)})`, batch);
  }
  return isInBatch(keys[0], batch);
}

export async function deleteRetentionBatch(
  table: PgTable,
  keys: TBatchKey,
  filter: TMaybeUndefined<SQL>,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select(Object.fromEntries(keys.map((key) => [key.name, key])))
    .from(table)
    .where(filter)
    .limit(limit);

  const deleted = await db
    .delete(table)
    .where(matchesBatch(keys, batch))
    .returning({ key: keys[0] });

  return deleted.length;
}
