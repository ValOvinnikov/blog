import { type SQL, type SQLWrapper, sql } from 'drizzle-orm';

// `IN (subquery)` plans a full-table hash join on every batch; `= ANY(ARRAY(…))` probes the primary key.
export function isInBatch(key: SQLWrapper, batch: SQLWrapper): SQL {
  return sql`${key} = any(array(${batch}))`;
}
